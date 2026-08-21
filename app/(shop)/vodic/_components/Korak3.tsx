import type { GuideCilj, GuideOpcija } from '@/lib/domain/guide-data';
import { bs } from '@/lib/i18n/bs';

type Korak3Props = {
  /** Odabrani ciljevi iz koraka 2, u redoslijedu odabira. */
  ciljevi: GuideCilj[];
  /** goalId → aktivne opcije za taj cilj, sortirane po redoslijed. */
  opcijePoCilju: Record<string, GuideOpcija[]>;
  /** goalId → tekst odabrane opcije. */
  odgovori: Record<string, string>;
  onPromjena: (odgovori: Record<string, string>) => void;
};

export function Korak3({ ciljevi, opcijePoCilju, odgovori, onPromjena }: Korak3Props) {
  const poruke = bs.vodic.korak3;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-bodoni text-lg font-semibold text-ritual-charcoal">{poruke.naslov}</h2>
        <p className="mt-1 text-sm text-ritual-charcoal/70">{poruke.podnaslov}</p>
      </div>

      {ciljevi.map((cilj) => {
        const opcije = opcijePoCilju[cilj.id];
        if (!opcije || opcije.length === 0) {
          return null;
        }

        return (
          <div key={cilj.id} className="flex flex-col gap-3">
            <span className="text-sm font-semibold text-ritual-deep-green">{cilj.naziv}</span>

            <div
              className="flex flex-col gap-2"
              role="radiogroup"
              aria-label={cilj.naziv}
            >
              {opcije.map((opcija) => (
                <label
                  key={opcija.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                    odgovori[cilj.id] === opcija.tekstOpcije
                      ? 'border-ritual-deep-green bg-ritual-green/40 text-ritual-charcoal'
                      : 'border-ritual-charcoal/15 text-ritual-charcoal hover:bg-ritual-beige'
                  }`}
                >
                  <input
                    type="radio"
                    name={`pitanje-${cilj.id}`}
                    checked={odgovori[cilj.id] === opcija.tekstOpcije}
                    onChange={() => onPromjena({ ...odgovori, [cilj.id]: opcija.tekstOpcije })}
                    className="h-4 w-4 border-ritual-charcoal/30 text-ritual-deep-green focus:ring-ritual-deep-green/40"
                  />
                  {opcija.tekstOpcije}
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
