'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCart } from '@/lib/cart/CartContext';
import { getCartProductsData } from '@/lib/domain/cart-data';
import { izracunajKorpu, nedostajuciIds, type KorpaProizvod } from '@/lib/domain/cart';
import { formatCijena } from '@/lib/domain/format';
import { bs } from '@/lib/i18n/bs';
import { CheckoutForma } from './_components/CheckoutForma';

export default function CheckoutPage() {
  const router = useRouter();
  const { stavke, ukloniStavku } = useCart();
  const { data: session, status: statusSesije } = useSession();
  const [proizvodi, setProizvodi] = useState<KorpaProizvod[]>([]);
  const [ucitano, setUcitano] = useState(false);
  const [narudzbaPoslata, setNarudzbaPoslata] = useState(false);

  const productIds = stavke.map((stavka) => stavka.productId);
  const kljucProizvoda = productIds.slice().sort().join(',');

  useEffect(() => {
    let otkazano = false;

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

  const korpa = izracunajKorpu(stavke, proizvodi);
  const nedostajuci = nedostajuciIds(stavke, proizvodi);
  const kljucNedostajucih = nedostajuci.join(',');

  useEffect(() => {
    if (!ucitano || nedostajuci.length === 0) {
      return;
    }
    for (const productId of nedostajuci) {
      ukloniStavku(productId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ucitano, kljucNedostajucih]);

  // Prazna korpa na checkoutu nema šta da naruči — nazad na korpu.
  useEffect(() => {
    if (ucitano && stavke.length === 0 && !narudzbaPoslata) {
      router.replace('/korpa');
    }
  }, [ucitano, stavke.length, narudzbaPoslata, router]);

  if (!ucitano || stavke.length === 0 || statusSesije === 'loading') {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center text-sm text-ritual-charcoal/70">
        {bs.checkout.ucitavanje}
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:py-12">
      <h1 className="font-bodoni text-2xl font-semibold text-ritual-charcoal sm:text-3xl">{bs.checkout.naslov}</h1>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="lg:w-1/2">
          <CheckoutForma
            stavke={stavke}
            onNarudzbaPoslata={() => setNarudzbaPoslata(true)}
            initialIme={session?.user?.name ?? ''}
            initialEmail={session?.user?.email ?? ''}
          />
        </div>

        <div className="flex flex-col gap-6 lg:w-1/2">
          <h2 className="font-bodoni text-lg font-semibold text-ritual-charcoal">{bs.checkout.pregledNarudzbe}</h2>

          <div className="flex flex-col gap-6">
            {korpa.grupe.map((grupa) => (
              <div
                key={grupa.brend.id}
                className="overflow-hidden rounded-2xl border border-ritual-charcoal/10 bg-white"
              >
                <div className="border-b border-ritual-charcoal/10 px-5 py-3">
                  <span className="text-sm font-semibold text-ritual-charcoal">{grupa.brend.naziv}</span>
                </div>

                <div className="flex flex-col divide-y divide-ritual-charcoal/10">
                  {grupa.linije.map((linija) => (
                    <div
                      key={linija.proizvod.id}
                      className="flex items-center justify-between gap-4 px-5 py-3 text-sm"
                    >
                      <span className="text-ritual-charcoal">
                        {linija.proizvod.naziv} × {linija.kolicina}
                      </span>
                      <span className="font-medium text-ritual-charcoal">
                        {formatCijena(linija.medjuzbir)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-ritual-charcoal/10 bg-ritual-beige/60 px-5 py-3 text-sm">
                  <span className="text-ritual-charcoal/70">{bs.checkout.dostava}</span>
                  <span className="font-medium text-ritual-charcoal">
                    {grupa.besplatnaDostava
                      ? bs.checkout.besplatnaDostava
                      : formatCijena(grupa.dostava)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 rounded-2xl bg-ritual-deep-green p-6 text-ritual-warm-white">
            <div className="flex items-center justify-between text-sm">
              <span>{bs.checkout.medjuzbir}</span>
              <span>{formatCijena(korpa.medjuzbir)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>{bs.checkout.dostavaUkupno}</span>
              <span>{formatCijena(korpa.dostavaUkupno)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-ritual-warm-white/20 pt-3 text-lg font-semibold">
              <span>{bs.checkout.ukupno}</span>
              <span>{formatCijena(korpa.ukupno)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
