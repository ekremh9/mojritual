'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, inArray, like, or } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  brandUsers,
  brands,
  featuringPricePlans,
  orderItems,
  productCategories,
  productGoalProposals,
  productGoals,
  productImages,
  products,
} from '@/lib/db/schema';
import type { Product } from '@/lib/db/schema';
import { getBrandVlasniciIds } from '@/lib/domain/admin-actions';
import { createNotification } from '@/lib/domain/notifications';
import {
  izracunajIstaknutStatus,
  NAZIV_PLACEHOLDER,
  normalizujProizvod,
  pripremiProizvod,
  validirajProizvod,
} from '@/lib/domain/product-form';
import { izvediSlugBazu, nasumicniNiz } from '@/lib/domain/slug';
import { bs } from '@/lib/i18n/bs';
import { obrisiSaR2 } from '@/lib/storage/r2-client';

export type PortalProizvodRezultat =
  | { ok: true; productId: string }
  | { ok: false; error: string };

export type PortalProizvodAkcijaRezultat = { ok: true } | { ok: false; error: string };

const CILJNI_STATUSI = ['nacrt', 'na_cekanju', 'zadrzi'] as const;
type CiljniStatus = (typeof CILJNI_STATUSI)[number];

function jeCiljniStatus(vrijednost: unknown): vrijednost is CiljniStatus {
  return typeof vrijednost === 'string' && (CILJNI_STATUSI as readonly string[]).includes(vrijednost);
}

/** Dodaje broj kad se osnovni slug poklapa sa postojećim (`naziv`, `naziv-2`, ...). */
async function osiguraJedinstvenSlug(baza: string): Promise<string> {
  const postojeci = await db
    .select({ slug: products.slug })
    .from(products)
    .where(or(eq(products.slug, baza), like(products.slug, `${baza}-%`)));

  const zauzeti = new Set(postojeci.map((red) => red.slug));
  if (!zauzeti.has(baza)) {
    return baza;
  }

  let broj = 2;
  while (zauzeti.has(`${baza}-${broj}`)) {
    broj += 1;
  }
  return `${baza}-${broj}`;
}

/**
 * Kreira prazan nacrt proizvoda čim brend otvori formu za novi proizvod —
 * bez ovoga `ProductImageUpload` sekcija ne postoji dok se forma prvi put
 * ne sačuva (nema `productId`), pa korisnik ne može dodati slike dok ne
 * popuni cijelu formu. Nacrt dobija minimalan, validan sadržaj (spec 10.4:
 * proizvod kreće kao `nacrt`, javno nevidljiv dok ne prođe odobrenje).
 *
 * Naziv dobija privremeni placeholder (`NAZIV_PLACEHOLDER`) kojeg korisnik
 * treba prepisati — smije ostati kao nacrt, ali `validirajProizvod` ga
 * odbija čim se cilja na `na_cekanju` (slanje na odobrenje). Slug dobija
 * prefiks `nacrt-`, signal da još nije zamijenjen pravim, izvedenim iz
 * stvarnog naziva (vidi `saveProductAction`).
 */
export async function createDraftProductAction(brandId: string): Promise<PortalProizvodRezultat> {
  try {
    const poruke = bs.portal.proizvodi.forma;
    const session = await auth();

    if (!session?.user?.id) {
      return { ok: false, error: poruke.greskaPristup };
    }

    if (typeof brandId !== 'string' || brandId.trim() === '') {
      return { ok: false, error: poruke.greskaPristup };
    }

    const [pristup] = await db
      .select({ uloga: brandUsers.uloga, status: brands.status })
      .from(brandUsers)
      .innerJoin(brands, eq(brandUsers.brandId, brands.id))
      .where(and(eq(brandUsers.userId, session.user.id), eq(brandUsers.brandId, brandId)))
      .limit(1);

    if (!pristup || (pristup.uloga !== 'vlasnik' && pristup.uloga !== 'urednik')) {
      return { ok: false, error: poruke.greskaPristup };
    }

    if (pristup.status === 'suspendovan') {
      return { ok: false, error: poruke.greskaSuspendovan };
    }

    const slug = await osiguraJedinstvenSlug(`nacrt-${nasumicniNiz()}`);

    const [noviProizvod] = await db
      .insert(products)
      .values({
        brandId,
        slug,
        naziv: NAZIV_PLACEHOLDER,
        forma: 'kapsula',
        cijena: 100,
        status: 'nacrt',
      })
      .returning({ id: products.id });

    return { ok: true, productId: noviProizvod!.id };
  } catch {
    console.error('createDraftProductAction: kreiranje nacrta nije uspjelo');
    return { ok: false, error: bs.portal.proizvodi.forma.greskaOpsta };
  }
}

/**
 * Snima proizvod iz portala brenda — insert kad je `productId` `null`,
 * inače update.
 *
 * Pristup se ne oslanja na `brandId`/`productId` sa klijenta bez provjere:
 * veza korisnik → brend se čita iz `brand_users`, a kod izmjene se dodatno
 * provjerava da proizvod pripada tom brendu — bez toga bi brend mogao
 * poslati tuđi `productId` i prepisati tuđi proizvod (spec 10.3).
 *
 * Validacija se ponavlja na serveru; klijentska je samo pogodnost.
 * Nikad ne baca grešku prema klijentu.
 */
export async function saveProductAction(
  brandId: string,
  productId: string | null,
  data: unknown,
  ciljniStatus: string,
): Promise<PortalProizvodRezultat> {
  try {
    const poruke = bs.portal.proizvodi.forma;
    const session = await auth();

    if (!session?.user?.id) {
      return { ok: false, error: poruke.greskaPristup };
    }

    if (typeof brandId !== 'string' || brandId.trim() === '') {
      return { ok: false, error: poruke.greskaPristup };
    }

    if (!jeCiljniStatus(ciljniStatus)) {
      return { ok: false, error: poruke.greskaOpsta };
    }

    const [pristup] = await db
      .select({ uloga: brandUsers.uloga, status: brands.status, verifikovan: brands.verifikovan })
      .from(brandUsers)
      .innerJoin(brands, eq(brandUsers.brandId, brands.id))
      .where(and(eq(brandUsers.userId, session.user.id), eq(brandUsers.brandId, brandId)))
      .limit(1);

    if (!pristup || (pristup.uloga !== 'vlasnik' && pristup.uloga !== 'urednik')) {
      return { ok: false, error: poruke.greskaPristup };
    }

    // Suspendovan brend ne mijenja ono što stoji na platformi dok se
    // suspenzija ne riješi.
    if (pristup.status === 'suspendovan') {
      return { ok: false, error: poruke.greskaSuspendovan };
    }

    let postojeciProizvod: {
      id: string;
      slug: string;
      status: Product['status'];
      istaknutStatus: Product['istaknutStatus'];
    } | null = null;

    if (productId !== null) {
      if (typeof productId !== 'string' || productId.trim() === '') {
        return { ok: false, error: poruke.greskaPristup };
      }

      const [red] = await db
        .select({
          id: products.id,
          slug: products.slug,
          status: products.status,
          istaknutStatus: products.istaknutStatus,
        })
        .from(products)
        .where(and(eq(products.id, productId), eq(products.brandId, brandId)))
        .limit(1);

      if (!red) {
        return { ok: false, error: poruke.greskaPristup };
      }

      postojeciProizvod = red;
    }

    // 'zadrzi' (Sačuvaj izmjene bez ponovnog odobrenja) je dozvoljen SAMO
    // kad je proizvod u bazi TRENUTNO 'odobren' — ne oslanjamo se na ono što
    // klijent tvrdi da vidi na ekranu (moglo je zastarjeti, ili je poziv
    // sastavljen ručno). Ako ne, tiho odbijamo, ne prihvatamo drugačiji ishod.
    if (ciljniStatus === 'zadrzi' && postojeciProizvod?.status !== 'odobren') {
      return { ok: false, error: poruke.greskaZadrziStatus };
    }

    const unos = normalizujProizvod(data);
    const greske = validirajProizvod(unos, ciljniStatus);
    const prvaGreska = Object.values(greske)[0];

    if (prvaGreska) {
      return { ok: false, error: prvaGreska };
    }

    const { kategorije, ...poljaProizvoda } = pripremiProizvod(unos);

    // Status isticanja zavisi od PRETHODNOG stanja (na_cekanju/odobreno
    // ostaju nepromijenjeni), ne samo od checkbox-a — vidi komentar uz
    // izracunajIstaknutStatus. Za nov proizvod prethodno stanje je uvijek
    // 'nema_zahtjeva' (isto što i default kolone).
    const noviIstaknutStatus = izracunajIstaknutStatus(
      postojeciProizvod?.istaknutStatus ?? 'nema_zahtjeva',
      unos.istaknutZahtjev,
    );

    // Paket se upisuje SAMO kad se šalje/ostaje nov zahtjev ('na_cekanju') —
    // tad se provjerava da izabrani paket stvarno postoji, aktivan je i
    // tipa 'proizvod' (klijent šalje samo ono što je vidio u formi, ne
    // garancija da je još uvijek važeće). Kad zahtjev nestaje, planId ide na
    // null. Kad status ostaje 'odobreno' (uređivanje ostalih polja na već
    // odobrenom isticanju), planId se NE dira — ne smije se tiho zamijeniti
    // paket bez nove admin odluke.
    let istaknutPlanIzmjena: { istaknutPlanId: string | null } | Record<string, never> = {};
    if (noviIstaknutStatus === 'nema_zahtjeva') {
      istaknutPlanIzmjena = { istaknutPlanId: null };
    } else if (noviIstaknutStatus === 'na_cekanju') {
      const planId = unos.istaknutPlanId?.trim();

      if (!planId) {
        return { ok: false, error: poruke.greskaIstaknutPlan };
      }

      const [plan] = await db
        .select({ id: featuringPricePlans.id })
        .from(featuringPricePlans)
        .where(
          and(
            eq(featuringPricePlans.id, planId),
            eq(featuringPricePlans.tip, 'proizvod'),
            eq(featuringPricePlans.aktivan, true),
          ),
        )
        .limit(1);

      if (!plan) {
        return { ok: false, error: poruke.greskaIstaknutPlan };
      }

      istaknutPlanIzmjena = { istaknutPlanId: plan.id };
    }

    // Verifikovan brend preskače red čekanja: slanje na odobrenje ('na_cekanju')
    // upisuje status 'odobren' odmah. Provjera se radi ovdje, na serveru, sa
    // istim `pristup` upitom koji već potvrđuje vlasništvo — ne kao odvojen
    // klijentski poziv koji bi se mogao zaobići. Ne dira 'nacrt' putanju niti
    // postojeće proizvode koji već čekaju (samo buduće slanje).
    const autoOdobreno = ciljniStatus === 'na_cekanju' && pristup.verifikovan;
    // 'zadrzi' NIKAD ne mijenja status kolonu — provjereno gore da je već
    // 'odobren', pa ovdje samo zadržava tu istu vrijednost eksplicitno
    // (ne prolazi kroz autoOdobreno/odobrenje ponovo, ne dira odobrenoAt).
    const finalniStatus: Product['status'] =
      ciljniStatus === 'zadrzi' ? 'odobren' : autoOdobreno ? 'odobren' : ciljniStatus;
    const poljaOdobrenja = autoOdobreno
      ? { odobrenoAt: new Date(), odobrioUserId: null }
      : {};

    // NAPOMENA ZA BUDUĆNOST: ako se ukine ručno odobravanje admina,
    // 'na_cekanju' ovdje treba postati odmah 'odobren' — do tada svaki novi
    // proizvod i svaka izmjena čeka pregled (spec 10.4), osim za verifikovane
    // brendove (vidi `autoOdobreno` iznad).
    const finalniId = await db.transaction(async (tx) => {
      let idProizvoda: string;

      if (postojeciProizvod) {
        idProizvoda = postojeciProizvod.id;

        // Nacrt kreiran čim se forma otvori (createDraftProductAction) dobija
        // samo privremeni slug ('nacrt-...'). Prvo snimanje nakon toga
        // izvodi pravi slug iz (stvarnog ili još uvijek placeholder) naziva
        // — nakon toga slug ostaje zamrznut kao i za svaki drugi proizvod
        // (stabilan javni URL).
        const noviSlug = postojeciProizvod.slug.startsWith('nacrt-')
          ? await osiguraJedinstvenSlug(izvediSlugBazu(poljaProizvoda.naziv))
          : null;

        await tx
          .update(products)
          .set({
            ...poljaProizvoda,
            ...(noviSlug ? { slug: noviSlug } : {}),
            status: finalniStatus,
            ...poljaOdobrenja,
            // Stari razlog odbijanja više ne opisuje stanje nakon izmjene.
            razlogOdbijanja: null,
            istaknutStatus: noviIstaknutStatus,
            istaknutRazlogOdbijanja: null,
            ...istaknutPlanIzmjena,
            updatedAt: new Date(),
          })
          .where(eq(products.id, idProizvoda));

        await tx.delete(productCategories).where(eq(productCategories.productId, idProizvoda));
      } else {
        const slug = await osiguraJedinstvenSlug(izvediSlugBazu(poljaProizvoda.naziv));

        const [noviProizvod] = await tx
          .insert(products)
          .values({
            ...poljaProizvoda,
            brandId,
            slug,
            status: finalniStatus,
            ...poljaOdobrenja,
            istaknutStatus: noviIstaknutStatus,
            ...istaknutPlanIzmjena,
          })
          .returning({ id: products.id });

        idProizvoda = noviProizvod!.id;
      }

      if (kategorije.length > 0) {
        await tx
          .insert(productCategories)
          .values(kategorije.map((categoryId) => ({ productId: idProizvoda, categoryId })));
      }

      // Sinhronizuje PRIJEDLOGE ciljeva (product_goal_proposals) sa checkbox
      // izborom u formi. Ovo NIKAD ne dira `product_goals` — tu vezu, sa
      // relevantnošću i oznakom, postavlja isključivo recenzent kroz
      // setProductGoalAction (CLAUDE.md pravilo 2). Brisanje/dodavanje ovdje
      // je bezopasno po recenzentovu odluku jer su tabele potpuno odvojene.
      const postojeciPrijedloziRedovi = await tx
        .select({ goalId: productGoalProposals.goalId })
        .from(productGoalProposals)
        .where(eq(productGoalProposals.productId, idProizvoda));
      const postojeciPrijedlozi = new Set(postojeciPrijedloziRedovi.map((red) => red.goalId));
      const noviPrijedlozi = new Set(unos.predlozeniCiljevi);

      const zaUklanjanje = [...postojeciPrijedlozi].filter((goalId) => !noviPrijedlozi.has(goalId));
      if (zaUklanjanje.length > 0) {
        await tx
          .delete(productGoalProposals)
          .where(
            and(
              eq(productGoalProposals.productId, idProizvoda),
              inArray(productGoalProposals.goalId, zaUklanjanje),
            ),
          );
      }

      const zaDodavanje = [...noviPrijedlozi].filter((goalId) => !postojeciPrijedlozi.has(goalId));
      if (zaDodavanje.length > 0) {
        await tx
          .insert(productGoalProposals)
          .values(zaDodavanje.map((goalId) => ({ productId: idProizvoda, goalId })));
      }

      return idProizvoda;
    });

    const [snimljeniProizvod] = await db
      .select({ slug: products.slug })
      .from(products)
      .where(eq(products.id, finalniId))
      .limit(1);

    revalidatePath('/portal/proizvodi');
    revalidatePath(`/portal/proizvodi/${finalniId}`);
    revalidatePath('/shop');
    if (snimljeniProizvod?.slug) {
      revalidatePath(`/proizvod/${snimljeniProizvod.slug}`);
    }

    if (autoOdobreno) {
      const vlasniciIds = await getBrandVlasniciIds(brandId);
      await Promise.all(
        vlasniciIds.map((userId) =>
          createNotification(
            userId,
            'proizvod_odobren',
            bs.notifikacije.proizvodAutomatskiOdobren.naslov,
            bs.notifikacije.proizvodAutomatskiOdobren.sadrzaj(poljaProizvoda.naziv),
            `/portal/proizvodi/${finalniId}`,
          ),
        ),
      );
    }

    return { ok: true, productId: finalniId };
  } catch {
    // Bez detalja unosa u logu.
    console.error('saveProductAction: snimanje proizvoda nije uspjelo');
    return { ok: false, error: bs.portal.proizvodi.forma.greskaOpsta };
  }
}

/**
 * Provjerava da li korisnik ima pristup datom proizvodu (vlasnik/urednik
 * brenda kojem proizvod pripada) i da brend nije suspendovan. Isti obrazac
 * kao `saveProductAction`, dijeli ga `unpublishProductAction` i
 * `deleteProductAction`.
 */
async function ucitajPristupProizvodu(userId: string, productId: string) {
  const [pristup] = await db
    .select({
      uloga: brandUsers.uloga,
      brandStatus: brands.status,
      productStatus: products.status,
      slug: products.slug,
    })
    .from(products)
    .innerJoin(brandUsers, eq(brandUsers.brandId, products.brandId))
    .innerJoin(brands, eq(brands.id, products.brandId))
    .where(and(eq(products.id, productId), eq(brandUsers.userId, userId)))
    .limit(1);

  return pristup ?? null;
}

/**
 * Povlači odobren proizvod iz prodaje — vraća ga na `nacrt` da nestane sa
 * storefronta bez brisanja. Dozvoljeno samo dok je proizvod `odobren`;
 * nacrt/na_cekanju/odbijen nemaju šta da se povuku (spec 10.4).
 */
export async function unpublishProductAction(productId: string): Promise<PortalProizvodAkcijaRezultat> {
  try {
    const poruke = bs.portal.proizvodi.akcije;
    const session = await auth();

    if (!session?.user?.id) {
      return { ok: false, error: poruke.greskaPristup };
    }

    if (typeof productId !== 'string' || productId.trim() === '') {
      return { ok: false, error: poruke.greskaPristup };
    }

    const pristup = await ucitajPristupProizvodu(session.user.id, productId);

    if (!pristup || (pristup.uloga !== 'vlasnik' && pristup.uloga !== 'urednik')) {
      return { ok: false, error: poruke.greskaPristup };
    }

    if (pristup.brandStatus === 'suspendovan') {
      return { ok: false, error: poruke.greskaSuspendovan };
    }

    if (pristup.productStatus !== 'odobren') {
      return { ok: false, error: poruke.greskaNijeObjavljen };
    }

    await db
      .update(products)
      .set({ status: 'nacrt', razlogOdbijanja: null, updatedAt: new Date() })
      .where(eq(products.id, productId));

    revalidatePath('/portal/proizvodi');
    revalidatePath(`/portal/proizvodi/${productId}`);
    revalidatePath('/shop');
    if (pristup.slug) {
      revalidatePath(`/proizvod/${pristup.slug}`);
    }

    return { ok: true };
  } catch {
    console.error('unpublishProductAction: povlačenje proizvoda nije uspjelo');
    return { ok: false, error: bs.portal.proizvodi.akcije.greskaOpsta };
  }
}

/**
 * Trajno briše proizvod — samo ako nikad nije bio dio narudžbe. Proizvod sa
 * istorijom narudžbi se ne smije obrisati (spec 6/16: `order_items` čuva
 * snapshot cijene i provizije za obračun i historiju kupca); brend ga
 * umjesto toga povlači iz prodaje.
 *
 * Slike se prvo brišu sa R2 (`obrisiSaR2`) da ne ostanu orphan fajlovi,
 * zatim se u transakciji brišu svi zavisni redovi pa sam proizvod.
 */
export async function deleteProductAction(productId: string): Promise<PortalProizvodAkcijaRezultat> {
  try {
    const poruke = bs.portal.proizvodi.akcije;
    const session = await auth();

    if (!session?.user?.id) {
      return { ok: false, error: poruke.greskaPristup };
    }

    if (typeof productId !== 'string' || productId.trim() === '') {
      return { ok: false, error: poruke.greskaPristup };
    }

    const pristup = await ucitajPristupProizvodu(session.user.id, productId);

    if (!pristup || (pristup.uloga !== 'vlasnik' && pristup.uloga !== 'urednik')) {
      return { ok: false, error: poruke.greskaPristup };
    }

    if (pristup.brandStatus === 'suspendovan') {
      return { ok: false, error: poruke.greskaSuspendovan };
    }

    const [postojecaNarudzba] = await db
      .select({ id: orderItems.id })
      .from(orderItems)
      .where(eq(orderItems.productId, productId))
      .limit(1);

    if (postojecaNarudzba) {
      return { ok: false, error: poruke.greskaImaNarudzbe };
    }

    const slike = await db
      .select({ url: productImages.url })
      .from(productImages)
      .where(eq(productImages.productId, productId));

    for (const slika of slike) {
      await obrisiSaR2(slika.url);
    }

    await db.transaction(async (tx) => {
      await tx.delete(productImages).where(eq(productImages.productId, productId));
      await tx.delete(productCategories).where(eq(productCategories.productId, productId));
      await tx.delete(productGoals).where(eq(productGoals.productId, productId));
      await tx.delete(productGoalProposals).where(eq(productGoalProposals.productId, productId));
      await tx.delete(products).where(eq(products.id, productId));
    });

    revalidatePath('/portal/proizvodi');
    revalidatePath('/shop');

    return { ok: true };
  } catch {
    console.error('deleteProductAction: brisanje proizvoda nije uspjelo');
    return { ok: false, error: bs.portal.proizvodi.akcije.greskaOpsta };
  }
}
