import Image from 'next/image';
import Link from 'next/link';
import { and, asc, count, desc, eq, inArray, notInArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { brands, categories, productImages, products } from '@/lib/db/schema';
import { getTopLevelCategoriesWithProducts } from '@/lib/domain/categories';
import { getHeroImageUrl, getShowHeroStats } from '@/lib/domain/site-settings';
import { bs } from '@/lib/i18n/bs';
import { CategoryIcon } from './_components/CategoryIcon';
import { PartnerKartica } from './_components/PartnerKartica';
import { ProizvodKartica } from './_components/ProizvodKartica';
import { VeleprodajaBaner } from './_components/VeleprodajaBaner';

const BROJ_ISTAKNUTIH = 10;
const BROJ_ISTAKNUTIH_PARTNERA = 6;

const KOLONE_PROIZVODA = {
  id: products.id,
  slug: products.slug,
  naziv: products.naziv,
  kratkiOpis: products.kratkiOpis,
  cijena: products.cijena,
};

const KOLONE_PARTNERA = {
  id: brands.id,
  slug: brands.slug,
  naziv: brands.naziv,
  kratkiOpis: brands.kratkiOpis,
  logoUrl: brands.logoUrl,
  verifikovan: brands.verifikovan,
  createdAt: brands.createdAt,
};

/**
 * Prvo proizvodi koje je admin stvarno istakao (`products.istaknutStatus =
 * 'odobreno'`, odvojeno od statusa proizvoda samog — vidi
 * lib/db/schema/products.ts). Ako ih ima manje od BROJ_ISTAKNUTIH, popuni
 * razliku najnovijim odobrenim proizvodima koji već nisu u prvoj listi, da
 * homepage nikad ne izgleda prazno dok admin ne istakne dovoljno proizvoda.
 *
 * Svaki proizvod nosi `jePravoIstaknuto` — `true` samo za onaj iz prvog
 * upita (stvarno istaknut), `false` za fallback popunu — da UI (badge na
 * kartici) može vizuelno razlikovati stvarno istaknuto od popune.
 */
async function getIstaknutiProizvodi() {
  const istaknuti = await db
    .select(KOLONE_PROIZVODA)
    .from(products)
    .innerJoin(brands, eq(products.brandId, brands.id))
    .where(
      and(
        eq(products.istaknutStatus, 'odobreno'),
        eq(products.status, 'odobren'),
        eq(brands.status, 'odobren'),
      ),
    )
    .orderBy(desc(products.createdAt))
    .limit(BROJ_ISTAKNUTIH);

  let odabraniProizvodi = istaknuti.map((proizvod) => ({ ...proizvod, jePravoIstaknuto: true }));

  if (odabraniProizvodi.length < BROJ_ISTAKNUTIH) {
    const preostalo = BROJ_ISTAKNUTIH - odabraniProizvodi.length;
    const uslovi = [eq(products.status, 'odobren'), eq(brands.status, 'odobren')];
    if (odabraniProizvodi.length > 0) {
      uslovi.push(
        notInArray(
          products.id,
          odabraniProizvodi.map((proizvod) => proizvod.id),
        ),
      );
    }

    const najnoviji = await db
      .select(KOLONE_PROIZVODA)
      .from(products)
      .innerJoin(brands, eq(products.brandId, brands.id))
      .where(and(...uslovi))
      .orderBy(desc(products.createdAt))
      .limit(preostalo);

    odabraniProizvodi = [
      ...odabraniProizvodi,
      ...najnoviji.map((proizvod) => ({ ...proizvod, jePravoIstaknuto: false })),
    ];
  }

  if (odabraniProizvodi.length === 0) {
    return [];
  }

  const slike = await db
    .select({
      productId: productImages.productId,
      url: productImages.url,
      alt: productImages.alt,
      redoslijed: productImages.redoslijed,
    })
    .from(productImages)
    .where(
      inArray(
        productImages.productId,
        odabraniProizvodi.map((proizvod) => proizvod.id),
      ),
    )
    .orderBy(asc(productImages.redoslijed));

  const prvaSlikaPoProizvodu = new Map<string, { url: string; alt: string | null }>();
  for (const slika of slike) {
    if (!prvaSlikaPoProizvodu.has(slika.productId)) {
      prvaSlikaPoProizvodu.set(slika.productId, { url: slika.url, alt: slika.alt });
    }
  }

  return odabraniProizvodi.map((proizvod) => ({
    ...proizvod,
    slika: prvaSlikaPoProizvodu.get(proizvod.id) ?? null,
  }));
}

/**
 * Isti fallback pattern kao `getIstaknutiProizvodi`: prvo partneri koje je
 * admin stvarno istakao (`brands.istaknut`), pa popuni razliku najnovijim
 * odobrenim partnerima koji već nisu u prvoj listi. Isti `jePravoIstaknuto`
 * marker, iz istog razloga (vidi komentar gore).
 */
async function getIstaknutiPartneri() {
  const istaknuti = await db
    .select(KOLONE_PARTNERA)
    .from(brands)
    .where(and(eq(brands.istaknut, true), eq(brands.status, 'odobren')))
    .orderBy(desc(brands.createdAt))
    .limit(BROJ_ISTAKNUTIH_PARTNERA);

  let odabraniPartneri = istaknuti.map((partner) => ({ ...partner, jePravoIstaknuto: true }));

  if (odabraniPartneri.length < BROJ_ISTAKNUTIH_PARTNERA) {
    const preostalo = BROJ_ISTAKNUTIH_PARTNERA - odabraniPartneri.length;
    const uslovi = [eq(brands.status, 'odobren')];
    if (odabraniPartneri.length > 0) {
      uslovi.push(
        notInArray(
          brands.id,
          odabraniPartneri.map((partner) => partner.id),
        ),
      );
    }

    const najnoviji = await db
      .select(KOLONE_PARTNERA)
      .from(brands)
      .where(and(...uslovi))
      .orderBy(desc(brands.createdAt))
      .limit(preostalo);

    odabraniPartneri = [
      ...odabraniPartneri,
      ...najnoviji.map((partner) => ({ ...partner, jePravoIstaknuto: false })),
    ];
  }

  if (odabraniPartneri.length === 0) {
    return [];
  }

  const brojevi = await db
    .select({ brandId: products.brandId, ukupno: count() })
    .from(products)
    .where(
      and(
        inArray(
          products.brandId,
          odabraniPartneri.map((partner) => partner.id),
        ),
        eq(products.status, 'odobren'),
      ),
    )
    .groupBy(products.brandId);

  const brojPoBrendu = new Map(brojevi.map((red) => [red.brandId, red.ukupno]));

  return odabraniPartneri.map((partner) => ({
    ...partner,
    brojProizvoda: brojPoBrendu.get(partner.id) ?? 0,
  }));
}

/** Stvarni brojevi iz baze za hero statistike — namjerno bez keširanja, ista svježina kao ostatak homepagea. */
async function getPocetnaStatistika() {
  const [[proizvodaRed], [partneraRed], [kategorijaRed]] = await Promise.all([
    db.select({ ukupno: count() }).from(products).where(eq(products.status, 'odobren')),
    db.select({ ukupno: count() }).from(brands).where(eq(brands.status, 'odobren')),
    db.select({ ukupno: count() }).from(categories),
  ]);

  return {
    proizvoda: proizvodaRed?.ukupno ?? 0,
    partnera: partneraRed?.ukupno ?? 0,
    kategorija: kategorijaRed?.ukupno ?? 0,
  };
}

export default async function HomePage() {
  const [kategorije, istaknutiProizvodi, istaknutiPartneri, statistika, heroSlikaUrl, prikaziStatistike] =
    await Promise.all([
      getTopLevelCategoriesWithProducts(),
      getIstaknutiProizvodi(),
      getIstaknutiPartneri(),
      getPocetnaStatistika(),
      getHeroImageUrl(),
      getShowHeroStats(),
    ]);

  return (
    <div className="flex flex-col">
      {/*
        Redizajn hero sekcije — nova paleta (--ritual-*) i fontovi
        (font-bodoni/font-montserrat) primijenjeni NAMJERNO samo ovdje, ne
        na ostatak stranice (vidi napomenu u globals.css). Dvokolonski
        layout: lijevo tekst/CTA/statistike (uvijek), desno slika ili
        gradient fallback — na mobitelu desna kolona uvijek ide ISPOD
        lijeve, fiksne (manje) visine bez obzira ima li sliku ili ne
        (jednostavnije i predvidljivije nego uslovno sakrivanje kad slika
        nije postavljena — vidi self-review).
      */}
      <section className="overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="flex flex-col justify-center bg-ritual-warm-white px-4 py-14 sm:px-6 sm:py-20 lg:px-12 lg:py-24">
            <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
              <h1 className="font-bodoni text-4xl leading-tight text-ritual-deep-green sm:text-5xl">
                {bs.homepage.hero.naslov}
              </h1>
              <p className="font-montserrat text-base leading-relaxed text-ritual-charcoal/80">
                {bs.homepage.hero.podnaslov}
              </p>

              {prikaziStatistike ? (
                <div className="flex flex-wrap gap-x-8 gap-y-3">
                  <div className="flex flex-col">
                    <span className="font-bodoni text-2xl font-semibold text-ritual-deep-green">
                      {statistika.proizvoda}+
                    </span>
                    <span className="font-montserrat text-xs text-ritual-charcoal/70">
                      {bs.homepage.hero.statistike.proizvoda}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bodoni text-2xl font-semibold text-ritual-deep-green">
                      {statistika.partnera}+
                    </span>
                    <span className="font-montserrat text-xs text-ritual-charcoal/70">
                      {bs.homepage.hero.statistike.partnera}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bodoni text-2xl font-semibold text-ritual-deep-green">
                      {statistika.kategorija}
                    </span>
                    <span className="font-montserrat text-xs text-ritual-charcoal/70">
                      {bs.homepage.hero.statistike.kategorija}
                    </span>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/vodic"
                  className="inline-flex items-center justify-center rounded-full bg-ritual-deep-green px-8 py-3 font-montserrat text-sm font-medium text-ritual-warm-white transition-colors hover:opacity-90"
                >
                  {bs.homepage.hero.cta}
                </Link>
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center rounded-full border border-ritual-deep-green px-8 py-3 font-montserrat text-sm font-medium text-ritual-deep-green transition-colors hover:bg-ritual-deep-green/5"
                >
                  {bs.homepage.hero.ctaSekundarno}
                </Link>
              </div>
            </div>
          </div>

          <div className="relative h-48 sm:h-64 lg:h-auto">
            {heroSlikaUrl ? (
              <Image
                src={heroSlikaUrl}
                alt=""
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-ritual-deep-green to-ritual-green" />
            )}
            {/*
              Blagi prelaz na LIJEVOJ ivici desne kolone, gdje se dodiruje
              sa lijevom (toplom) kolonom — isti overlay bez obzira je li
              pozadina slika ili gradient fallback (izvan if/else iznad),
              da granica "utapa" jednu pozadinu u drugu umjesto oštre linije.
              5 stop-ova sa opadajućom providnošću (ease-out krivulja, ne
              linearna) umjesto samo from/to — i providnost na samoj ivici
              je namjerno ispod 100% (0.62) da se fotografija nazire ispod
              čak i na najgušćem dijelu prelaza. Tailwind `bg-gradient-to-r
              from-X to-transparent` je ovdje namjerno zamijenjen raw
              `backgroundImage` — JIT skener ne bi uhvatio dinamički
              sastavljen `bg-[...]` string, a inline gradient sa 5 stop-ova
              kao jedan neprekinut Tailwind arbitrary token bio bi
              nečitljiv.

              `hidden lg:block` — MORA biti isti breakpoint kao grid prelom
              iznad (`grid-cols-1 lg:grid-cols-2`). Ispod `lg` je desna
              kolona naslagana ISPOD lijeve (jedna kolona), pa horizontalni
              fade na "lijevoj ivici" tamo nema smisla (nema lijeve kolone
              pored nje) — bez ovog uslova bi overlay ostao vidljiv preko
              vrha slike na mobitelu/tabletu.
            */}
            <div
              className="pointer-events-none absolute inset-y-0 left-0 hidden w-[40%] lg:block"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(250, 249, 245, 0.62) 0%, rgba(250, 249, 245, 0.37) 25%, rgba(250, 249, 245, 0.18) 50%, rgba(250, 249, 245, 0.07) 75%, rgba(250, 249, 245, 0) 100%)',
              }}
            />
          </div>
        </div>
      </section>

      <section className="px-4 pt-6 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <VeleprodajaBaner />
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-bodoni text-2xl font-semibold text-ritual-charcoal sm:text-3xl">
            {bs.homepage.kategorije.naslov}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {kategorije.map((kategorija) => (
              <Link
                key={kategorija.id}
                href={`/shop?kategorija=${kategorija.slug}`}
                className="flex flex-col rounded-2xl bg-ritual-green p-5 transition-transform hover:-translate-y-0.5"
              >
                <CategoryIcon ime={kategorija.ikona} className="h-6 w-6 text-ritual-deep-green" />
                <span className="mt-3 text-base font-medium text-ritual-charcoal">
                  {kategorija.naziv}
                </span>
                {kategorija.opis ? (
                  <span className="mt-1 text-sm text-ritual-charcoal/70">{kategorija.opis}</span>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-bodoni text-2xl font-semibold text-ritual-charcoal sm:text-3xl">
            {bs.homepage.istaknutiProizvodi.naslov}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {istaknutiProizvodi.map((proizvod) => (
              <ProizvodKartica
                key={proizvod.id}
                proizvod={proizvod}
                istaknuto={proizvod.jePravoIstaknuto}
              />
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-full border border-ritual-charcoal/20 px-6 py-2.5 text-sm font-medium text-ritual-charcoal transition-colors hover:bg-ritual-beige"
            >
              {bs.homepage.istaknutiProizvodi.vidiSve}
            </Link>
          </div>
        </div>
      </section>

      {istaknutiPartneri.length > 0 ? (
        <section className="px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-bodoni text-2xl font-semibold text-ritual-charcoal sm:text-3xl">
              {bs.homepage.istaknutiPartneri.naslov}
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
              {istaknutiPartneri.map((partner) => (
                <PartnerKartica
                  key={partner.id}
                  partner={partner}
                  istaknuto={partner.jePravoIstaknuto}
                />
              ))}
            </div>
            <div className="mt-8 flex justify-center">
              <Link
                href="/partneri"
                className="inline-flex items-center justify-center rounded-full border border-ritual-charcoal/20 px-6 py-2.5 text-sm font-medium text-ritual-charcoal transition-colors hover:bg-ritual-beige"
              >
                {bs.homepage.istaknutiPartneri.vidiSve}
              </Link>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
