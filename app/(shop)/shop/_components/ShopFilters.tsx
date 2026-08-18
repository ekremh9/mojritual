'use client';

import { useState, useTransition, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Search, SlidersHorizontal } from 'lucide-react';
import { bs } from '@/lib/i18n/bs';
import type { ShopFilteri, ShopForma, ShopSort } from '@/lib/domain/shop-query';

export type ShopKategorijaOpcija = {
  slug: string;
  naziv: string;
  podkategorije: readonly { slug: string; naziv: string }[];
};

// Labele su jedini izvor liste — redoslijed ključeva u `bs` je i redoslijed u dropdownu.
const FORME = Object.keys(bs.shop.forme) as ShopForma[];
const SORTOVI = Object.keys(bs.shop.sort) as ShopSort[];

/**
 * Gradi `/shop` URL iz filtera. Podrazumijevane vrijednosti se izostavljaju da
 * dijeljeni linkovi ostanu čitljivi i da `/shop` bude kanonski prazan katalog.
 */
export function shopHref(filteri: ShopFilteri): string {
  const parametri = new URLSearchParams();

  if (filteri.q !== null) {
    parametri.set('q', filteri.q);
  }
  if (filteri.kategorija !== null) {
    parametri.set('kategorija', filteri.kategorija);
  }
  if (filteri.forma !== null) {
    parametri.set('forma', filteri.forma);
  }
  if (filteri.sort !== 'novo') {
    parametri.set('sort', filteri.sort);
  }
  if (filteri.stranica > 1) {
    parametri.set('stranica', String(filteri.stranica));
  }

  const upit = parametri.toString();
  return upit.length > 0 ? `/shop?${upit}` : '/shop';
}

export function ShopPretraga({ filteri }: { filteri: ShopFilteri }) {
  const router = useRouter();
  const [pojam, setPojam] = useState(filteri.q ?? '');
  const [uToku, pocniPrelaz] = useTransition();

  function posalji(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ocisceno = pojam.trim();

    pocniPrelaz(() => {
      router.push(
        shopHref({ ...filteri, q: ocisceno.length > 0 ? ocisceno : null, stranica: 1 }),
      );
    });
  }

  return (
    <form onSubmit={posalji} role="search" className="flex items-center gap-2">
      <label htmlFor="shop-pretraga" className="sr-only">
        {bs.shop.pretraga.labela}
      </label>
      <div className="relative flex-1">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A9086]"
        />
        <input
          id="shop-pretraga"
          type="search"
          name="q"
          value={pojam}
          onChange={(event) => setPojam(event.target.value)}
          placeholder={bs.shop.pretraga.placeholder}
          className="w-full rounded-full border border-[#1C2B22]/15 bg-white py-2.5 pl-11 pr-4 text-sm text-[#1C2B22] placeholder:text-[#8A9086] focus:border-[#16332A] focus:outline-none focus:ring-2 focus:ring-[#16332A]/20"
        />
      </div>
      <button
        type="submit"
        disabled={uToku}
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#16332A] px-6 py-2.5 text-sm font-medium text-[#F2F5ED] transition-colors hover:bg-[#16332A]/90 disabled:opacity-60"
      >
        {bs.shop.pretraga.dugme}
      </button>
    </form>
  );
}

type ShopFilterPanelProps = {
  filteri: ShopFilteri;
  kategorije: ShopKategorijaOpcija[];
  aktivniFilteri: boolean;
};

export function ShopFilterPanel({ filteri, kategorije, aktivniFilteri }: ShopFilterPanelProps) {
  const router = useRouter();
  const [otvoreno, setOtvoreno] = useState(false);
  const [uToku, pocniPrelaz] = useTransition();

  // Svaka izmjena filtera vraća na prvu stranicu — stara stranica često ne postoji.
  function primijeni(izmjene: Partial<ShopFilteri>) {
    pocniPrelaz(() => {
      router.push(shopHref({ ...filteri, ...izmjene, stranica: 1 }));
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => setOtvoreno((prethodno) => !prethodno)}
        aria-expanded={otvoreno}
        aria-controls="shop-filter-panel"
        className="inline-flex items-center justify-between gap-2 rounded-full border border-[#1C2B22]/15 bg-white px-5 py-2.5 text-sm font-medium text-[#1C2B22] transition-colors hover:bg-[#F2F5ED] lg:hidden"
      >
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
          {bs.shop.filteri.otvori}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 transition-transform ${otvoreno ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        id="shop-filter-panel"
        className={`${otvoreno ? 'flex' : 'hidden'} flex-col gap-4 rounded-2xl border border-[#1C2B22]/10 bg-white p-5 lg:flex ${
          uToku ? 'opacity-60' : ''
        }`}
      >
        <h2 className="hidden text-sm font-semibold uppercase tracking-wide text-[#8A9086] lg:block">
          {bs.shop.filteri.naslov}
        </h2>

        <FilterSelect
          id="filter-kategorija"
          labela={bs.shop.filteri.kategorija}
          vrijednost={filteri.kategorija ?? ''}
          onPromjena={(vrijednost) => primijeni({ kategorija: vrijednost || null })}
        >
          <option value="">{bs.shop.filteri.sveKategorije}</option>
          {kategorije.flatMap((kategorija) => [
            // Top-level je sam po sebi klikabilna opcija — filtrira na cijelu
            // granu (razrijesiKategorijuIds vraća njen ID + sve podkategorije,
            // nepromijenjeno). Podkategorije ispod nje su samo vizuelno uvučene
            // (razmak u tekstu) — bez optgroup-a, jer optgroup labela sama nije
            // klikabilna, pa je do sad postojala odvojena "Sve — X" opcija koja
            // je zbunjivala umjesto da sam naziv grane bude izbor.
            <option key={kategorija.slug} value={kategorija.slug}>
              {kategorija.naziv}
            </option>,
            ...kategorija.podkategorije.map((podkategorija) => (
              <option key={podkategorija.slug} value={podkategorija.slug}>
                {'  '}
                {podkategorija.naziv}
              </option>
            )),
          ])}
        </FilterSelect>

        <FilterSelect
          id="filter-forma"
          labela={bs.shop.filteri.forma}
          vrijednost={filteri.forma ?? ''}
          onPromjena={(vrijednost) => primijeni({ forma: (vrijednost || null) as ShopForma | null })}
        >
          <option value="">{bs.shop.filteri.sveForme}</option>
          {FORME.map((forma) => (
            <option key={forma} value={forma}>
              {bs.shop.forme[forma]}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          id="filter-sort"
          labela={bs.shop.filteri.sort}
          vrijednost={filteri.sort}
          onPromjena={(vrijednost) => primijeni({ sort: vrijednost as ShopSort })}
        >
          {SORTOVI.map((sort) => (
            <option key={sort} value={sort}>
              {bs.shop.sort[sort]}
            </option>
          ))}
        </FilterSelect>

        {aktivniFilteri ? (
          <button
            type="button"
            onClick={() => pocniPrelaz(() => router.push('/shop'))}
            className="mt-1 inline-flex items-center justify-center rounded-full border border-[#1C2B22]/20 px-5 py-2 text-sm font-medium text-[#1C2B22] transition-colors hover:bg-[#F2F5ED]"
          >
            {bs.shop.filteri.ocisti}
          </button>
        ) : null}
      </div>
    </div>
  );
}

type FilterSelectProps = {
  id: string;
  labela: string;
  vrijednost: string;
  onPromjena: (vrijednost: string) => void;
  children: ReactNode;
};

function FilterSelect({ id, labela, vrijednost, onPromjena, children }: FilterSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-[#1C2B22]">
        {labela}
      </label>
      <div className="relative">
        <select
          id={id}
          value={vrijednost}
          onChange={(event) => onPromjena(event.target.value)}
          className="w-full appearance-none rounded-xl border border-[#1C2B22]/15 bg-white py-2.5 pl-3 pr-9 text-sm text-[#1C2B22] focus:border-[#16332A] focus:outline-none focus:ring-2 focus:ring-[#16332A]/20"
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A9086]"
        />
      </div>
    </div>
  );
}
