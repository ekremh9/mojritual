'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Search } from 'lucide-react';
import {
  PARTNERI_SORTOVI_VIDLJIVI,
  type PartneriFilteri,
  type PartneriSort,
} from '@/lib/domain/partners-query';
import { bs } from '@/lib/i18n/bs';

/**
 * Gradi `/partneri` URL iz filtera. Podrazumijevane vrijednosti se
 * izostavljaju da dijeljeni linkovi ostanu čitljivi (isti princip kao
 * `shopHref`).
 */
function partneriHref(filteri: PartneriFilteri): string {
  const parametri = new URLSearchParams();

  if (filteri.q !== null) {
    parametri.set('q', filteri.q);
  }
  if (filteri.sort !== 'preporuceno') {
    parametri.set('sort', filteri.sort);
  }

  const upit = parametri.toString();
  return upit.length > 0 ? `/partneri?${upit}` : '/partneri';
}

export function PartneriFilterBar({ filteri }: { filteri: PartneriFilteri }) {
  const router = useRouter();
  const [pojam, setPojam] = useState(filteri.q ?? '');
  const [uToku, pocniPrelaz] = useTransition();

  function posaljiPretragu(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ocisceno = pojam.trim();

    pocniPrelaz(() => {
      router.push(partneriHref({ ...filteri, q: ocisceno.length > 0 ? ocisceno : null }));
    });
  }

  function promijeniSort(sort: PartneriSort) {
    pocniPrelaz(() => {
      router.push(partneriHref({ ...filteri, sort }));
    });
  }

  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center ${uToku ? 'opacity-60' : ''}`}>
      <form onSubmit={posaljiPretragu} role="search" className="flex flex-1 items-center gap-2">
        <label htmlFor="partneri-pretraga" className="sr-only">
          {bs.partneri.pretraga.labela}
        </label>
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A9086]"
          />
          <input
            id="partneri-pretraga"
            type="search"
            name="q"
            value={pojam}
            onChange={(event) => setPojam(event.target.value)}
            placeholder={bs.partneri.pretraga.placeholder}
            className="w-full rounded-full border border-[#1C2B22]/15 bg-white py-2.5 pl-11 pr-4 text-sm text-[#1C2B22] placeholder:text-[#8A9086] focus:border-[#16332A] focus:outline-none focus:ring-2 focus:ring-[#16332A]/20"
          />
        </div>
        <button
          type="submit"
          disabled={uToku}
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#16332A] px-6 py-2.5 text-sm font-medium text-[#F2F5ED] transition-colors hover:bg-[#16332A]/90 disabled:opacity-60"
        >
          {bs.partneri.pretraga.dugme}
        </button>
      </form>

      <div className="flex flex-col gap-1.5 sm:w-56">
        <label htmlFor="partneri-sort" className="sr-only">
          {bs.partneri.filteri.sort}
        </label>
        <div className="relative">
          <select
            id="partneri-sort"
            // "preporuceno" (tihi default kad ?sort= nije zadan) namjerno nije
            // među opcijama — select se prikazuje prazan dok korisnik svjesno
            // ne odabere jedan od tri ponuđena sortiranja.
            value={filteri.sort === 'preporuceno' ? '' : filteri.sort}
            onChange={(event) => promijeniSort(event.target.value as PartneriSort)}
            className="w-full appearance-none rounded-xl border border-[#1C2B22]/15 bg-white py-2.5 pl-3 pr-9 text-sm text-[#1C2B22] focus:border-[#16332A] focus:outline-none focus:ring-2 focus:ring-[#16332A]/20"
          >
            {PARTNERI_SORTOVI_VIDLJIVI.map((sort) => (
              <option key={sort} value={sort}>
                {bs.partneri.sort[sort]}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A9086]"
          />
        </div>
      </div>
    </div>
  );
}
