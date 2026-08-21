import Link from 'next/link';
import { notFound } from 'next/navigation';
import { asc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { brands, orderItems, orderShipments, orders } from '@/lib/db/schema';
import { formatCijena } from '@/lib/domain/format';
import { bs } from '@/lib/i18n/bs';

type NarudzbaPageProps = {
  params: Promise<{ broj: string }>;
};

export default async function NarudzbaPage({ params }: NarudzbaPageProps) {
  const { broj } = await params;

  // SIGURNOSNA NAPOMENA — namjerno ograničenje za MVP guest checkout:
  // broj narudžbe je čitljiv i pogodljiv (MR-2026-00421), a ova stranica je
  // javna i ne traži prijavu. Zato se ovdje NIKAD ne selektuju/prikazuju
  // kupac_ime, kupac_email, kupac_telefon, adresa, grad ni postanski_broj —
  // samo broj narudžbe, stavke, dostava po pošiljci i ukupan iznos, što bi
  // svako mogao vidjeti i da je slučajno pogodio broj.
  const [narudzba] = await db
    .select({
      id: orders.id,
      broj: orders.broj,
      iznosStavki: orders.iznosStavki,
      iznosDostave: orders.iznosDostave,
      ukupno: orders.ukupno,
    })
    .from(orders)
    .where(eq(orders.broj, broj))
    .limit(1);

  if (!narudzba) {
    notFound();
  }

  const posiljke = await db
    .select({
      id: orderShipments.id,
      cijenaDostave: orderShipments.cijenaDostave,
      besplatnaDostava: orderShipments.besplatnaDostava,
      brendNaziv: brands.naziv,
    })
    .from(orderShipments)
    .innerJoin(brands, eq(orderShipments.brandId, brands.id))
    .where(eq(orderShipments.orderId, narudzba.id))
    .orderBy(asc(brands.naziv));

  const stavke =
    posiljke.length === 0
      ? []
      : await db
          .select({
            shipmentId: orderItems.shipmentId,
            nazivSnapshot: orderItems.nazivSnapshot,
            cijenaSnapshot: orderItems.cijenaSnapshot,
            kolicina: orderItems.kolicina,
          })
          .from(orderItems)
          .where(
            inArray(
              orderItems.shipmentId,
              posiljke.map((posiljka) => posiljka.id),
            ),
          );

  const stavkePoPosiljci = new Map<string, typeof stavke>();
  for (const stavka of stavke) {
    const postojece = stavkePoPosiljci.get(stavka.shipmentId) ?? [];
    postojece.push(stavka);
    stavkePoPosiljci.set(stavka.shipmentId, postojece);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 lg:py-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-bodoni text-2xl font-semibold text-ritual-charcoal sm:text-3xl">{bs.narudzba.hvala}</h1>
        <p className="text-lg font-medium text-ritual-deep-green">{bs.narudzba.brojNarudzbe(narudzba.broj)}</p>
        <p className="max-w-md text-sm text-ritual-charcoal/70">{bs.narudzba.napomenaPlacanje}</p>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="font-bodoni text-lg font-semibold text-ritual-charcoal">{bs.narudzba.pregledNarudzbe}</h2>

        <div className="flex flex-col gap-6">
          {posiljke.map((posiljka) => (
            <div
              key={posiljka.id}
              className="overflow-hidden rounded-2xl border border-ritual-charcoal/10 bg-white"
            >
              <div className="border-b border-ritual-charcoal/10 px-5 py-3">
                <span className="text-sm font-semibold text-ritual-charcoal">{posiljka.brendNaziv}</span>
              </div>

              <div className="flex flex-col divide-y divide-ritual-charcoal/10">
                {(stavkePoPosiljci.get(posiljka.id) ?? []).map((stavka, indeks) => (
                  <div
                    key={indeks}
                    className="flex items-center justify-between gap-4 px-5 py-3 text-sm"
                  >
                    <span className="text-ritual-charcoal">
                      {stavka.nazivSnapshot} × {stavka.kolicina}
                    </span>
                    <span className="font-medium text-ritual-charcoal">
                      {formatCijena(stavka.cijenaSnapshot * stavka.kolicina)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-ritual-charcoal/10 bg-ritual-beige/60 px-5 py-3 text-sm">
                <span className="text-ritual-charcoal/70">{bs.narudzba.dostava}</span>
                <span className="font-medium text-ritual-charcoal">
                  {posiljka.besplatnaDostava
                    ? bs.narudzba.besplatnaDostava
                    : formatCijena(posiljka.cijenaDostave)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-ritual-deep-green p-6 text-ritual-warm-white">
        <div className="flex items-center justify-between text-sm">
          <span>{bs.narudzba.medjuzbir}</span>
          <span>{formatCijena(narudzba.iznosStavki)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>{bs.narudzba.dostavaUkupno}</span>
          <span>{formatCijena(narudzba.iznosDostave)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-ritual-warm-white/20 pt-3 text-lg font-semibold">
          <span>{bs.narudzba.ukupno}</span>
          <span>{formatCijena(narudzba.ukupno)}</span>
        </div>
      </div>

      <Link
        href="/shop"
        className="inline-flex items-center justify-center self-center rounded-full bg-ritual-deep-green px-6 py-3 text-sm font-medium text-ritual-warm-white transition-colors hover:bg-ritual-deep-green/90"
      >
        {bs.narudzba.nastaviKupovinu}
      </Link>
    </div>
  );
}
