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
const KLASA_PILL_AKTIVNA = 'border-ritual-deep-green bg-ritual-deep-green text-ritual-warm-white';
const KLASA_PILL_NEAKTIVNA = 'border-ritual-charcoal/20 text-ritual-charcoal hover:bg-ritual-beige';

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
        <h2 className="font-bodoni text-lg font-semibold text-ritual-charcoal">{poruke.naslov}</h2>
        <p className="mt-1 text-sm text-ritual-charcoal/70">{poruke.podnaslov}</p>
      </div>

      <div>
        <span className="text-sm font-medium text-ritual-charcoal">{poruke.spol.naslov}</span>
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
        <span className="text-sm font-medium text-ritual-charcoal">{poruke.starosnaGrupa.naslov}</span>
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
        <div className="flex flex-col gap-3 rounded-2xl border border-ritual-deep-green/20 bg-ritual-green/30 px-5 py-4">
          <p className="text-sm leading-relaxed text-ritual-charcoal">{poruke.napomenaMaloljetni}</p>
          <label className="flex items-center gap-2.5 text-sm font-medium text-ritual-charcoal">
            <input
              type="checkbox"
              checked={osnovniPodaci.potvrdaMaloljetnosti}
              onChange={(event) =>
                onPromjena({ ...osnovniPodaci, potvrdaMaloljetnosti: event.target.checked })
              }
              className="h-4 w-4 rounded border-ritual-charcoal/30 text-ritual-deep-green focus:ring-ritual-deep-green/40"
            />
            {poruke.potvrdaMaloljetni}
          </label>
        </div>
      ) : null}
    </div>
  );
}
