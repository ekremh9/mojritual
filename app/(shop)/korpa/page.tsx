'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, X } from 'lucide-react';
import { useCart } from '@/lib/cart/CartContext';
import { getCartProductsData } from '@/lib/domain/cart-data';
import {
  MAX_KOLICINA_PARTNER,
  MAX_KOLICINA_PO_STAVCI,
  izracunajKorpu,
  nedostajuciIds,
  type KorpaProizvod,
} from '@/lib/domain/cart';
import { formatCijena } from '@/lib/domain/format';
import { bs } from '@/lib/i18n/bs';

export default function KorpaPage() {
  const { stavke, postaviKolicinu, ukloniStavku, jePartner } = useCart();
  const [proizvodi, setProizvodi] = useState<KorpaProizvod[]>([]);
  const [ucitano, setUcitano] = useState(false);
  const [prikaziNapomenuNedostajucih, setPrikaziNapomenuNedostajucih] = useState(false);

  const maxKolicina = jePartner ? MAX_KOLICINA_PARTNER : MAX_KOLICINA_PO_STAVCI;

  const productIds = stavke.map((stavka) => stavka.productId);
  const kljucProizvoda = productIds.slice().sort().join(',');

  useEffect(() => {
    let otkazano = false;

    // getCartProductsData vraća [] za praznu listu, pa nema potrebe za
    // posebnom sinhronom granom — svaki slučaj prolazi kroz isti async put.
    getCartProductsData(productIds).then((rezultat) => {
      if (!otkazano) {
        setProizvodi(rezultat);
        setUcitano(true);
      }
    });

    return () => {
      otkazano = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kljucProizvoda]);

  const korpa = izracunajKorpu(stavke, proizvodi, jePartner);
  const nedostajuci = nedostajuciIds(stavke, proizvodi);
  const kljucNedostajucih = nedostajuci.join(',');

  useEffect(() => {
    if (!ucitano || nedostajuci.length === 0) {
      return;
    }
    // Uklanjanje nedostajućih stavki je reakcija na promjenu zavisnosti
    // (rezultat fetch-a), ne na spoljni event — sinhroni setState je ovdje
    // namjeran.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrikaziNapomenuNedostajucih(true);
    for (const productId of nedostajuci) {
      ukloniStavku(productId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ucitano, kljucNedostajucih]);

  if (ucitano && stavke.length === 0) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-24 text-center">
        <p className="text-lg font-medium text-ritual-charcoal">{bs.korpa.prazna}</p>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center rounded-full bg-ritual-deep-green px-6 py-3 text-sm font-medium text-ritual-warm-white transition-colors hover:bg-ritual-deep-green/90"
        >
          {bs.korpa.nastaviKupovinu}
        </Link>
      </div>
    );
  }

  if (!ucitano) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center text-sm text-ritual-charcoal/70">
        {bs.korpa.ucitavanje}
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-8 sm:px-6 lg:py-12">
      <h1 className="font-bodoni text-2xl font-semibold text-ritual-charcoal sm:text-3xl">{bs.korpa.naslov}</h1>

      {prikaziNapomenuNedostajucih ? (
        <p className="rounded-2xl bg-ritual-green/40 px-4 py-3 text-sm text-ritual-charcoal">
          {bs.korpa.nedostajuciProizvodi}
        </p>
      ) : null}

      <div className="flex flex-col gap-6">
        {korpa.grupe.map((grupa) => (
          <div
            key={grupa.brend.id}
            className="overflow-hidden rounded-2xl border border-ritual-charcoal/10 bg-white"
          >
            <div className="border-b border-ritual-charcoal/10 px-5 py-3">
              <Link
                href={`/partner/${grupa.brend.slug}`}
                className="text-sm font-semibold text-ritual-charcoal hover:underline"
              >
                {grupa.brend.naziv}
              </Link>
            </div>

            <div className="flex flex-col divide-y divide-ritual-charcoal/10">
              {grupa.linije.map((linija) => (
                <div
                  key={linija.proizvod.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
                >
                  <div className="flex flex-1 items-center gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ritual-beige">
                      {linija.proizvod.slika ? (
                        <Image
                          src={linija.proizvod.slika.url}
                          alt={linija.proizvod.slika.alt ?? linija.proizvod.naziv}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/proizvod/${linija.proizvod.slug}`}
                        className="text-sm font-medium text-ritual-charcoal hover:underline"
                      >
                        {linija.proizvod.naziv}
                      </Link>
                      <span className="text-sm text-ritual-charcoal/70">
                        {formatCijena(linija.jedinicnaCijena)}
                        {linija.jedinicnaCijena !== linija.proizvod.cijena ? (
                          <span className="ml-2 text-xs text-ritual-charcoal/40 line-through">
                            {formatCijena(linija.proizvod.cijena)}
                          </span>
                        ) : null}
                      </span>
                      {linija.jedinicnaCijena !== linija.proizvod.cijena ? (
                        <span className="text-xs font-medium text-ritual-deep-green">
                          {bs.korpa.veleprodajnaCijena(formatCijena(linija.jedinicnaCijena))}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="flex items-center rounded-full border border-ritual-charcoal/20">
                      <button
                        type="button"
                        onClick={() => postaviKolicinu(linija.proizvod.id, linija.kolicina - 1)}
                        disabled={linija.kolicina <= 1}
                        aria-label={bs.korpa.smanjiKolicinu}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-ritual-charcoal transition-colors hover:bg-ritual-beige disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-ritual-charcoal">
                        {linija.kolicina}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          postaviKolicinu(
                            linija.proizvod.id,
                            Math.min(maxKolicina, linija.kolicina + 1),
                          )
                        }
                        disabled={linija.kolicina >= maxKolicina}
                        aria-label={bs.korpa.povecajKolicinu}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-ritual-charcoal transition-colors hover:bg-ritual-beige disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <span className="w-20 text-right text-sm font-semibold text-ritual-charcoal">
                      {formatCijena(linija.medjuzbir)}
                    </span>

                    <button
                      type="button"
                      onClick={() => ukloniStavku(linija.proizvod.id)}
                      aria-label={bs.korpa.ukloni}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-ritual-charcoal/50 transition-colors hover:bg-ritual-beige hover:text-ritual-charcoal"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-ritual-charcoal/10 bg-ritual-beige/60 px-5 py-3 text-sm">
              <span className="text-ritual-charcoal/70">{bs.korpa.dostava}</span>
              <span className="font-medium text-ritual-charcoal">
                {grupa.besplatnaDostava ? bs.korpa.besplatnaDostava : formatCijena(grupa.dostava)}
              </span>
            </div>
            {grupa.doBesplatneDostave !== null ? (
              <p className="bg-ritual-beige/60 px-5 pb-4 text-xs text-[#8A9086]">
                {bs.korpa.doBesplatneDostave(formatCijena(grupa.doBesplatneDostave))}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-ritual-deep-green p-6 text-ritual-warm-white">
        <div className="flex items-center justify-between text-sm">
          <span>{bs.korpa.medjuzbir}</span>
          <span>{formatCijena(korpa.medjuzbir)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>{bs.korpa.dostavaUkupno}</span>
          <span>{formatCijena(korpa.dostavaUkupno)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-ritual-warm-white/20 pt-3 text-lg font-semibold">
          <span>{bs.korpa.ukupno}</span>
          <span>{formatCijena(korpa.ukupno)}</span>
        </div>
        <Link
          href="/checkout"
          className="mt-2 inline-flex items-center justify-center rounded-full bg-ritual-beige px-6 py-3 text-sm font-medium text-ritual-deep-green transition-colors hover:bg-ritual-beige/90"
        >
          {bs.korpa.nastaviNaPlacanje}
        </Link>
      </div>
    </div>
  );
}
