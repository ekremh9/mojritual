import {
  STAROSNE_GRUPE,
  zahtjevaPotvrduMaloljetnosti,
  type GuideOsnovniPodaci,
  type Spol,
  type StarosnaGrupa,
} from '@/lib/domain/guide';
import { bs } from '@/lib/i18n/bs';

const KLASA_PILL =
  'inline-flex items-center justify-center rounded-full border px-5 py-2.5 text-sm font-medium transition-colors';
const KLASA_PILL_AKTIVNA = 'border-[#16332A] bg-[#16332A] text-[#F2F5ED]';
const KLASA_PILL_NEAKTIVNA = 'border-[#1C2B22]/20 text-[#1C2B22] hover:bg-[#F2F5ED]';

type Korak1Props = {
  osnovniPodaci: GuideOsnovniPodaci;
  onPromjena: (osnovniPodaci: GuideOsnovniPodaci) => void;
};

export function Korak1({ osnovniPodaci, onPromjena }: Korak1Props) {
  const poruke = bs.vodic.korak1;

  function postaviSpol(spol: Spol | null) {
    onPromjena({ ...osnovniPodaci, spol });
  }

  function postaviStarosnuGrupu(starosnaGrupa: StarosnaGrupa) {
    const ista = osnovniPodaci.starosnaGrupa === starosnaGrupa;
    onPromjena({
      ...osnovniPodaci,
      starosnaGrupa: ista ? null : starosnaGrupa,
      potvrdaMaloljetnosti: ista ? false : osnovniPodaci.potvrdaMaloljetnosti,
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-semibold text-[#1C2B22]">{poruke.naslov}</h2>
        <p className="mt-1 text-sm text-[#1C2B22]/70">{poruke.podnaslov}</p>
      </div>

      <div>
        <span className="text-sm font-medium text-[#1C2B22]">{poruke.spol.naslov}</span>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={poruke.spol.naslov}>
          <button
            type="button"
            aria-pressed={osnovniPodaci.spol === 'M'}
            onClick={() => postaviSpol('M')}
            className={`${KLASA_PILL} ${osnovniPodaci.spol === 'M' ? KLASA_PILL_AKTIVNA : KLASA_PILL_NEAKTIVNA}`}
          >
            {poruke.spol.m}
          </button>
          <button
            type="button"
            aria-pressed={osnovniPodaci.spol === 'Z'}
            onClick={() => postaviSpol('Z')}
            className={`${KLASA_PILL} ${osnovniPodaci.spol === 'Z' ? KLASA_PILL_AKTIVNA : KLASA_PILL_NEAKTIVNA}`}
          >
            {poruke.spol.z}
          </button>
          <button
            type="button"
            aria-pressed={osnovniPodaci.spol === null}
            onClick={() => postaviSpol(null)}
            className={`${KLASA_PILL} ${osnovniPodaci.spol === null ? KLASA_PILL_AKTIVNA : KLASA_PILL_NEAKTIVNA}`}
          >
            {poruke.spol.preskoci}
          </button>
        </div>
      </div>

      <div>
        <span className="text-sm font-medium text-[#1C2B22]">{poruke.starosnaGrupa.naslov}</span>
        <div
          className="mt-3 flex flex-wrap gap-2"
          role="group"
          aria-label={poruke.starosnaGrupa.naslov}
        >
          {STAROSNE_GRUPE.map((grupa) => (
            <button
              key={grupa}
              type="button"
              aria-pressed={osnovniPodaci.starosnaGrupa === grupa}
              onClick={() => postaviStarosnuGrupu(grupa)}
              className={`${KLASA_PILL} ${osnovniPodaci.starosnaGrupa === grupa ? KLASA_PILL_AKTIVNA : KLASA_PILL_NEAKTIVNA}`}
            >
              {poruke.starosnaGrupa.opcije[grupa]}
            </button>
          ))}
        </div>
      </div>

      {zahtjevaPotvrduMaloljetnosti(osnovniPodaci.starosnaGrupa) ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-[#16332A]/20 bg-[#C7D6BA]/30 px-5 py-4">
          <p className="text-sm leading-relaxed text-[#1C2B22]">{poruke.napomenaMaloljetni}</p>
          <label className="flex items-center gap-2.5 text-sm font-medium text-[#1C2B22]">
            <input
              type="checkbox"
              checked={osnovniPodaci.potvrdaMaloljetnosti}
              onChange={(event) =>
                onPromjena({ ...osnovniPodaci, potvrdaMaloljetnosti: event.target.checked })
              }
              className="h-4 w-4 rounded border-[#1C2B22]/30 text-[#16332A] focus:ring-[#16332A]/40"
            />
            {poruke.potvrdaMaloljetni}
          </label>
        </div>
      ) : null}
    </div>
  );
}
