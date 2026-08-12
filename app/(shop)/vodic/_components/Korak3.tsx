import { GUIDE_DODATNA_PITANJA } from '@/lib/domain/guide-questions';
import type { GuideCilj } from '@/lib/domain/guide-data';
import { bs } from '@/lib/i18n/bs';

type Korak3Props = {
  /** Odabrani ciljevi iz koraka 2, u redoslijedu odabira. */
  ciljevi: GuideCilj[];
  /** goalId → indeks odabrane opcije. */
  odgovori: Record<string, number>;
  onPromjena: (odgovori: Record<string, number>) => void;
};

export function Korak3({ ciljevi, odgovori, onPromjena }: Korak3Props) {
  const poruke = bs.vodic.korak3;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-semibold text-[#1C2B22]">{poruke.naslov}</h2>
        <p className="mt-1 text-sm text-[#1C2B22]/70">{poruke.podnaslov}</p>
      </div>

      {ciljevi.map((cilj) => {
        const pitanje = GUIDE_DODATNA_PITANJA[cilj.slug];
        if (!pitanje) {
          return null;
        }

        return (
          <div key={cilj.id} className="flex flex-col gap-3">
            <span className="text-sm font-semibold text-[#16332A]">{cilj.naziv}</span>
            <span className="text-sm font-medium text-[#1C2B22]">{pitanje.pitanje}</span>

            <div className="flex flex-col gap-2" role="radiogroup" aria-label={pitanje.pitanje}>
              {pitanje.opcije.map((opcija, indeks) => (
                <label
                  key={opcija}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                    odgovori[cilj.id] === indeks
                      ? 'border-[#16332A] bg-[#C7D6BA]/40 text-[#1C2B22]'
                      : 'border-[#1C2B22]/15 text-[#1C2B22] hover:bg-[#F2F5ED]'
                  }`}
                >
                  <input
                    type="radio"
                    name={`pitanje-${cilj.id}`}
                    checked={odgovori[cilj.id] === indeks}
                    onChange={() => onPromjena({ ...odgovori, [cilj.id]: indeks })}
                    className="h-4 w-4 border-[#1C2B22]/30 text-[#16332A] focus:ring-[#16332A]/40"
                  />
                  {opcija}
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
