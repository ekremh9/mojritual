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
        <h2 className="text-lg font-semibold text-[#1C2B22]">{poruke.naslov}</h2>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-sm text-[#1C2B22]/70">{poruke.podnaslov}</p>
          <span className="text-sm font-medium text-[#16332A]">
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
                  ? 'border-[#16332A] bg-[#C7D6BA]/40 text-[#1C2B22]'
                  : onemoguceno
                    ? 'cursor-not-allowed border-[#1C2B22]/10 text-[#1C2B22]/40'
                    : 'cursor-pointer border-[#1C2B22]/15 text-[#1C2B22] hover:bg-[#F2F5ED]'
              }`}
            >
              <input
                type="checkbox"
                checked={oznacen}
                disabled={onemoguceno}
                onChange={() => prekidac(cilj.id)}
                className="h-4 w-4 rounded border-[#1C2B22]/30 text-[#16332A] focus:ring-[#16332A]/40 disabled:cursor-not-allowed"
              />
              {cilj.naziv}
            </label>
          );
        })}
      </div>
    </div>
  );
}
