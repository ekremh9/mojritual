'use client';

import { useState } from 'react';
import Link from 'next/link';
import { saveGuideResultAction } from '@/lib/domain/guide-actions';
import type { GuideRezultat } from '@/lib/domain/guide';
import { bs } from '@/lib/i18n/bs';
import { GuideProizvodKartica } from './GuideProizvodKartica';

type RezultatProps = {
  rezultat: GuideRezultat;
  sessionId: string;
  ulogovan: boolean;
  onPonovi: () => void;
};

export function Rezultat({ rezultat, sessionId, ulogovan, onPonovi }: RezultatProps) {
  const poruke = bs.vodic.rezultat;
  const [cuvanje, setCuvanje] = useState(false);
  const [sacuvano, setSacuvano] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);

  async function sacuvajRezultat() {
    setGreska(null);
    setCuvanje(true);

    try {
      const rezultatAkcije = await saveGuideResultAction(sessionId);

      if (!rezultatAkcije.ok) {
        setGreska(rezultatAkcije.error);
        return;
      }

      setSacuvano(true);
    } catch {
      setGreska(bs.vodic.greskaOpsta);
    } finally {
      setCuvanje(false);
    }
  }

  return (
    <div className="mt-8 flex flex-col gap-10">
      <div>
        <h2 className="font-bodoni text-xl font-semibold text-ritual-charcoal sm:text-2xl">{poruke.naslov}</h2>
        <p className="mt-1 text-sm text-ritual-charcoal/70">{poruke.podnaslov}</p>
      </div>

      {rezultat.grupe.map((grupa) => (
        <section key={grupa.goalId} className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold text-ritual-charcoal">{grupa.naziv}</h3>

          {grupa.tekstObjasnjenja ? (
            <p className="rounded-2xl bg-ritual-green/30 px-5 py-4 text-sm leading-relaxed text-ritual-charcoal">
              {grupa.tekstObjasnjenja}
            </p>
          ) : null}

          {grupa.proizvodi.length === 0 ? (
            <p className="text-sm text-ritual-charcoal/60">{poruke.prazno}</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {grupa.proizvodi.map((proizvod) => (
                <GuideProizvodKartica key={proizvod.id} proizvod={proizvod} />
              ))}
            </div>
          )}
        </section>
      ))}

      <div className="rounded-2xl border border-ritual-charcoal/10 bg-ritual-beige px-5 py-4 text-xs leading-relaxed text-ritual-charcoal/70">
        {bs.vodic.disclaimer}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={onPonovi}
          className="inline-flex items-center justify-center rounded-full border border-ritual-charcoal/20 px-6 py-3 text-sm font-medium text-ritual-charcoal transition-colors hover:bg-ritual-beige"
        >
          {poruke.nazadNaPocetak}
        </button>

        {ulogovan ? (
          <button
            type="button"
            onClick={sacuvajRezultat}
            disabled={cuvanje || sacuvano}
            className="text-sm font-medium text-ritual-deep-green underline underline-offset-2 hover:no-underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sacuvano
              ? poruke.rezultatSacuvan
              : cuvanje
                ? poruke.cuvanje
                : poruke.sacuvajRezultat}
          </button>
        ) : (
          <Link
            href="/registracija"
            className="text-sm font-medium text-ritual-deep-green underline underline-offset-2 hover:no-underline"
          >
            {poruke.sacuvajNalog}
          </Link>
        )}
      </div>

      {greska ? (
        <p role="alert" className="text-sm text-[#B3261E]">
          {greska}
        </p>
      ) : null}
    </div>
  );
}
