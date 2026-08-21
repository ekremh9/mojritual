import type { GuideCilj } from '@/lib/domain/guide-data';
import { MAX_ODABRANIH_CILJEVA } from '@/lib/domain/guide';
import { bs } from '@/lib/i18n/bs';

type Korak2Props = {
  ciljevi: GuideCilj[];
  odabrani: string[];
  onPromjena: (odabrani: string[]) => void;
};

export function Korak2({ ciljevi, odabrani, onPromjena }: Korak2Props) {
  const poruke = bs.vodic.korak2;

  function prekidac(goalId: string) {
    if (odabrani.includes(goalId)) {
      onPromjena(odabrani.filter((id) => id !== goalId));
      return;
    }
    if (odabrani.length >= MAX_ODABRANIH_CILJEVA) {
      return;
    }
    onPromjena([...odabrani, goalId]);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-bodoni text-lg font-semibold text-ritual-charcoal">{poruke.naslov}</h2>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-sm text-ritual-charcoal/70">{poruke.podnaslov}</p>
          <span className="text-sm font-medium text-ritual-deep-green">
            {poruke.odabrano(odabrani.length)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ciljevi.map((cilj) => {
          const oznacen = odabrani.includes(cilj.id);
          const onemoguceno = !oznacen && odabrani.length >= MAX_ODABRANIH_CILJEVA;

          return (
            <label
              key={cilj.id}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm font-medium transition-colors ${
                oznacen
                  ? 'border-ritual-deep-green bg-ritual-green/40 text-ritual-charcoal'
                  : onemoguceno
                    ? 'cursor-not-allowed border-ritual-charcoal/10 text-ritual-charcoal/40'
                    : 'cursor-pointer border-ritual-charcoal/15 text-ritual-charcoal hover:bg-ritual-beige'
              }`}
            >
              <input
                type="checkbox"
                checked={oznacen}
                disabled={onemoguceno}
                onChange={() => prekidac(cilj.id)}
                className="h-4 w-4 rounded border-ritual-charcoal/30 text-ritual-deep-green focus:ring-ritual-deep-green/40 disabled:cursor-not-allowed"
              />
              {cilj.naziv}
            </label>
          );
        })}
      </div>
    </div>
  );
}
