'use server';

import { createHash, randomBytes } from 'crypto';
import { eq, inArray, sql } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { brands, orderItems, orderShipments, orders } from '@/lib/db/schema';
import { izracunajKorpu, parsirajStavke, type KorpaStavka } from '@/lib/domain/cart';
import { getCartProductsData } from '@/lib/domain/cart-data';
import { formatCijena } from '@/lib/domain/format';
import { normalizujCheckoutUnos, validirajCheckoutUnos } from '@/lib/domain/order-form';
import { sendOrderConfirmationEmail } from '@/lib/email/send';
import { bs } from '@/lib/i18n/bs';

export type CreateOrderRezultat = { ok: true; orderBroj: string } | { ok: false; error: string };

// Bez 0/O i 1/I — broj narudžbe kupac ponekad diktira telefonom kuriru.
const NASUMICNI_ALFABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const DUZINA_NASUMICNOG_DIJELA = 6;
const MAX_POKUSAJA_BROJ_NARUDZBE = 5;

/**
 * Nasumični dio broja narudžbe (npr. `K7X2P9`). Broj narudžbe je javno
 * vidljiv bez prijave (stranica potvrde narudžbe), pa NE smije otkrivati
 * koliko je narudžbi ukupno napravljeno — zato se sekvenca `order_broj_seq`
 * više ne prikazuje direktno kao brojač, nego ulazi samo kao dio ulaza (uz
 * kriptografski siguran nasumičan izvor) u derivaciju ovog stringa preko
 * SHA-256. `sledeciIzSekvence`/`pokusaj` razlikuju uzastopne pokušaje pri
 * sudaru; sama nasumičnost dolazi od `randomBytes`, ne od sekvence.
 */
function izvediNasumicniDioBroja(sledeciIzSekvence: string, pokusaj: number): string {
  const ulaz = Buffer.concat([
    Buffer.from(sledeciIzSekvence),
    Buffer.from(String(pokusaj)),
    randomBytes(16),
  ]);
  const hash = createHash('sha256').update(ulaz).digest();

  let rezultat = '';
  for (let i = 0; i < DUZINA_NASUMICNOG_DIJELA; i++) {
    rezultat += NASUMICNI_ALFABET[hash[i] % NASUMICNI_ALFABET.length];
  }
  return rezultat;
}

/**
 * Kreira narudžbu iz korpe — guest checkout, plaćanje isključivo pouzećem.
 *
 * Cijene, dostupnost i obračun korpe se NIKAD ne uzimaju sa klijenta.
 * Klijent šalje samo productId/kolicina; proizvodi se ponovo dohvataju iz
 * baze i korpa se ponovo izračunava kroz `izracunajKorpu` — to je jedini
 * izvor istine za iznose (spec 6, CLAUDE.md pravilo 5).
 *
 * Cijela narudžba (orders + order_shipments + order_items) ide u jednu
 * transakciju — ako bilo šta padne, ništa se ne commituje.
 *
 * Nikad ne baca grešku prema klijentu, hvata sve u try/catch.
 */
export async function createOrderAction(
  formData: unknown,
  stavke: KorpaStavka[],
): Promise<CreateOrderRezultat> {
  try {
    const poruke = bs.checkout;
    const stavkeCiste = parsirajStavke(stavke);

    if (stavkeCiste.length === 0) {
      return { ok: false, error: poruke.greskaKorpaPrazna };
    }

    const productIds = stavkeCiste.map((stavka) => stavka.productId);
    const proizvodi = await getCartProductsData(productIds);

    if (proizvodi.length === 0) {
      return { ok: false, error: poruke.greskaProizvodiNedostupni };
    }

    const korpa = izracunajKorpu(stavkeCiste, proizvodi);

    if (korpa.grupe.length === 0) {
      return { ok: false, error: poruke.greskaProizvodiNedostupni };
    }

    const unos = normalizujCheckoutUnos(formData);
    const greske = validirajCheckoutUnos(unos);
    const prvaGreska = Object.values(greske)[0];

    if (prvaGreska) {
      return { ok: false, error: prvaGreska };
    }

    const session = await auth();
    const brandIds = korpa.grupe.map((grupa) => grupa.brend.id);

    const orderBroj = await db.transaction(async (tx) => {
      const provizijeRedovi = await tx
        .select({ id: brands.id, provizijaMpPosto: brands.provizijaMpPosto })
        .from(brands)
        .where(inArray(brands.id, brandIds));
      const provizijaPoBrendu = new Map(
        provizijeRedovi.map((red) => [red.id, red.provizijaMpPosto]),
      );

      // nextval() se i dalje poziva pri svakoj narudžbi (atoman na nivou baze,
      // za internu upotrebu ako ikad zatreba) — ali njegova vrijednost se
      // NIGDJE ne prikazuje direktno, samo ulazi u derivaciju nasumičnog
      // broja ispod. Vidi komentar uz `orderBrojSequence` u
      // lib/db/schema/orders.ts.
      const redovi = await tx.execute<{ sledeci: string }>(
        sql`select nextval('order_broj_seq') as sledeci`,
      );
      const sledeciIzSekvence = String(redovi[0]?.sledeci);
      const godina = new Date().getFullYear();

      let broj: string | null = null;
      for (let pokusaj = 0; pokusaj < MAX_POKUSAJA_BROJ_NARUDZBE; pokusaj++) {
        const kandidat = `MR-${godina}-${izvediNasumicniDioBroja(sledeciIzSekvence, pokusaj)}`;
        const [postojeca] = await tx
          .select({ id: orders.id })
          .from(orders)
          .where(eq(orders.broj, kandidat))
          .limit(1);

        if (!postojeca) {
          broj = kandidat;
          break;
        }
      }

      if (!broj) {
        throw new Error('Nije moguće generisati jedinstven broj narudžbe.');
      }

      const [novaNarudzba] = await tx
        .insert(orders)
        .values({
          broj,
          userId: session?.user?.id ?? null,
          tip: 'maloprodaja',
          kupacIme: unos.ime,
          kupacEmail: unos.email,
          kupacTelefon: unos.telefon,
          adresa: unos.adresa,
          grad: unos.grad,
          postanskiBroj: unos.postanskiBroj,
          napomena: unos.napomena === '' ? null : unos.napomena,
          iznosStavki: korpa.medjuzbir,
          iznosDostave: korpa.dostavaUkupno,
          ukupno: korpa.ukupno,
          nacinPlacanja: 'pouzece',
          status: 'na_cekanju',
        })
        .returning({ id: orders.id });

      const orderId = novaNarudzba!.id;

      for (const grupa of korpa.grupe) {
        const [posiljka] = await tx
          .insert(orderShipments)
          .values({
            orderId,
            brandId: grupa.brend.id,
            iznosStavki: grupa.medjuzbir,
            cijenaDostave: grupa.dostava,
            besplatnaDostava: grupa.besplatnaDostava,
            status: 'novo',
          })
          .returning({ id: orderShipments.id });

        const shipmentId = posiljka!.id;
        // Default se ne bi trebao desiti — svaki brend iz korpe je upravo
        // pročitan iz `brands` — ali korpa nikad ne smije puknuti zbog
        // nedostajuće provizije.
        const provizijaPosto = provizijaPoBrendu.get(grupa.brend.id) ?? '20.00';

        await tx.insert(orderItems).values(
          grupa.linije.map((linija) => ({
            shipmentId,
            productId: linija.proizvod.id,
            nazivSnapshot: linija.proizvod.naziv,
            cijenaSnapshot: linija.proizvod.cijena,
            kolicina: linija.kolicina,
            provizijaPostoSnapshot: provizijaPosto,
            provizijaIznos: Math.round((linija.medjuzbir * parseFloat(provizijaPosto)) / 100),
          })),
        );
      }

      return broj;
    });

    const stavkeZaEmail = korpa.grupe.flatMap((grupa) =>
      grupa.linije.map((linija) => ({
        naziv: linija.proizvod.naziv,
        kolicina: linija.kolicina,
        cijena: formatCijena(linija.medjuzbir),
      })),
    );
    await sendOrderConfirmationEmail(
      unos.email,
      unos.ime,
      orderBroj,
      stavkeZaEmail,
      formatCijena(korpa.ukupno),
    );

    return { ok: true, orderBroj };
  } catch {
    // Bez detalja unosa (ime, email, adresa) u logu — CLAUDE.md pravilo 4.
    console.error('createOrderAction: kreiranje narudžbe nije uspjelo');
    return { ok: false, error: bs.checkout.greskaOpsta };
  }
}
