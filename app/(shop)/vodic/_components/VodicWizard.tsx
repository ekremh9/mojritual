'use client';

import { useState } from 'react';
import { computeGuideResultAction } from '@/lib/domain/guide-actions';
import {
  mozeNastavitiIzKorak1,
  validanBrojCiljeva,
  type GuideOdgovori,
  type GuideOsnovniPodaci,
  type GuideRezultat,
} from '@/lib/domain/guide';
import type { GuideCilj, GuideOpcija } from '@/lib/domain/guide-data';
import { bs } from '@/lib/i18n/bs';
import { Korak1 } from './Korak1';
import { Korak2 } from './Korak2';
import { Korak3 } from './Korak3';
import { Rezultat } from './Rezultat';

const PRAZNI_OSNOVNI_PODACI: GuideOsnovniPodaci = {
  spol: null,
  starosnaGrupa: null,
  potvrdaMaloljetnosti: false,
};

const UKUPNO_KORAKA = 3;

type Korak = 1 | 2 | 3;

export function VodicWizard({
  ciljevi,
  opcijePoCilju,
  ulogovan,
}: {
  ciljevi: GuideCilj[];
  opcijePoCilju: Record<string, GuideOpcija[]>;
  ulogovan: boolean;
}) {
  const [korak, setKorak] = useState<Korak>(1);
  const [osnovniPodaci, setOsnovniPodaci] = useState<GuideOsnovniPodaci>(PRAZNI_OSNOVNI_PODACI);
  const [odabraniCiljevi, setOdabraniCiljevi] = useState<string[]>([]);
  const [dodatnaPitanja, setDodatnaPitanja] = useState<Record<string, string>>({});
  const [rezultat, setRezultat] = useState<GuideRezultat | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [ucitavanje, setUcitavanje] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);

  const ciljPoId = new Map(ciljevi.map((cilj) => [cilj.id, cilj]));
  const odabraniCiljObjekti = odabraniCiljevi
    .map((id) => ciljPoId.get(id))
    .filter((cilj): cilj is GuideCilj => cilj !== undefined);

  function ponovi() {
    setKorak(1);
    setOsnovniPodaci(PRAZNI_OSNOVNI_PODACI);
    setOdabraniCiljevi([]);
    setDodatnaPitanja({});
    setRezultat(null);
    setSessionId(null);
    setGreska(null);
  }

  async function zavrsi() {
    setGreska(null);
    setUcitavanje(true);

    const odgovori: GuideOdgovori = {
      osnovniPodaci,
      ciljevi: odabraniCiljevi,
      dodatnaPitanja,
    };

    try {
      const rezultatAkcije = await computeGuideResultAction(odgovori);

      if (!rezultatAkcije.ok) {
        setGreska(rezultatAkcije.error);
        return;
      }

      setRezultat(rezultatAkcije.rezultat);
      setSessionId(rezultatAkcije.sessionId);
    } catch {
      setGreska(bs.vodic.greskaOpsta);
    } finally {
      setUcitavanje(false);
    }
  }

  if (rezultat && sessionId) {
    return (
      <Rezultat
        rezultat={rezultat}
        sessionId={sessionId}
        ulogovan={ulogovan}
        onPonovi={ponovi}
      />
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-8">
      <span className="text-sm font-medium text-[#8A9086]">
        {bs.vodic.korakOd(korak, UKUPNO_KORAKA)}
      </span>

      {korak === 1 ? (
        <Korak1 osnovniPodaci={osnovniPodaci} onPromjena={setOsnovniPodaci} />
      ) : korak === 2 ? (
        <Korak2 ciljevi={ciljevi} odabrani={odabraniCiljevi} onPromjena={setOdabraniCiljevi} />
      ) : (
        <Korak3
          ciljevi={odabraniCiljObjekti}
          opcijePoCilju={opcijePoCilju}
          odgovori={dodatnaPitanja}
          onPromjena={setDodatnaPitanja}
        />
      )}

      {greska ? (
        <p role="alert" className="rounded-xl bg-[#B3261E]/10 px-4 py-3 text-sm text-[#B3261E]">
          {greska}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-4">
        {korak > 1 ? (
          <button
            type="button"
            onClick={() => setKorak((trenutni) => (trenutni - 1) as Korak)}
            disabled={ucitavanje}
            className="inline-flex items-center justify-center rounded-full border border-ritual-charcoal/20 px-6 py-3 text-sm font-medium text-ritual-charcoal transition-colors hover:bg-ritual-beige disabled:cursor-not-allowed disabled:opacity-60"
          >
            {bs.vodic.dugmad.nazad}
          </button>
        ) : (
          <span />
        )}

        {korak === 1 ? (
          <button
            type="button"
            disabled={!mozeNastavitiIzKorak1(osnovniPodaci)}
            onClick={() => setKorak(2)}
            className="inline-flex items-center justify-center rounded-full bg-ritual-deep-green px-8 py-3 text-sm font-medium text-ritual-warm-white transition-colors hover:bg-ritual-deep-green/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {bs.vodic.dugmad.dalje}
          </button>
        ) : korak === 2 ? (
          <button
            type="button"
            disabled={!validanBrojCiljeva(odabraniCiljevi)}
            onClick={() => setKorak(3)}
            className="inline-flex items-center justify-center rounded-full bg-ritual-deep-green px-8 py-3 text-sm font-medium text-ritual-warm-white transition-colors hover:bg-ritual-deep-green/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {bs.vodic.dugmad.dalje}
          </button>
        ) : (
          <button
            type="button"
            disabled={ucitavanje}
            onClick={zavrsi}
            className="inline-flex items-center justify-center rounded-full bg-ritual-deep-green px-8 py-3 text-sm font-medium text-ritual-warm-white transition-colors hover:bg-ritual-deep-green/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {ucitavanje ? bs.vodic.dugmad.ucitavanje : bs.vodic.dugmad.vidiRezultate}
          </button>
        )}
      </div>

      <p className="text-xs leading-relaxed text-ritual-charcoal/50">{bs.vodic.disclaimer}</p>
    </div>
  );
}
