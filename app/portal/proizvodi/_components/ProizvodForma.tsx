'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { KategorijaOpcija } from '@/lib/domain/categories';
import type { GuideCilj } from '@/lib/domain/guide-data';
import {
  MAX_KRATKI_OPIS,
  PRODUCT_DOSTUPNOSTI,
  PRODUCT_FORME,
  validirajProizvod,
  type GreskeProizvoda,
  type PoljeProizvoda,
  type ProizvodUnos,
} from '@/lib/domain/product-form';
import { saveProductAction } from '@/lib/domain/portal-product-actions';
import type { Product } from '@/lib/db/schema';
import { bs } from '@/lib/i18n/bs';

const STATUS_KLASE: Record<Product['status'], string> = {
  nacrt: 'bg-[#8A9086]/15 text-[#1C2B22]/70',
  na_cekanju: 'bg-amber-100 text-amber-800',
  odobren: 'bg-[#16332A] text-[#F2F5ED]',
  odbijen: 'bg-[#B3261E]/10 text-[#B3261E]',
};

const KLASE_POLJA =
  'w-full rounded-xl border border-[#1C2B22]/15 bg-white px-4 py-2.5 text-sm text-[#1C2B22] outline-none transition placeholder:text-[#1C2B22]/40 focus:border-[#16332A] focus:ring-2 focus:ring-[#16332A]/20 disabled:cursor-not-allowed disabled:bg-[#F2F5ED] disabled:text-[#1C2B22]/60';

const KLASE_LABELE = 'text-sm font-medium text-[#1C2B22]';

const KLASE_KARTICE = 'flex flex-col gap-4 rounded-2xl border border-[#1C2B22]/10 bg-white p-5';

type CiljniStatus = 'nacrt' | 'na_cekanju';

type ProizvodFormaProps = {
  brandId: string;
  /** `null` = novi proizvod (insert). Inače id proizvoda koji se uređuje (update). */
  productId: string | null;
  pocetneVrijednosti: ProizvodUnos;
  kategorije: KategorijaOpcija[];
  ciljevi: GuideCilj[];
  /** Proizvod koji se uređuje je trenutno `odobren` — izmjena ga vraća na pregled. */
  ponovnoOdobrenje: boolean;
  /** Brend je suspendovan — forma se prikazuje, ali se ne može mijenjati. */
  onemoguceno: boolean;
  /** `null` = novi proizvod, još nema statusa. */
  status: Product['status'] | null;
  /** Razlog odbijanja — prikazuje se samo kad je status `odbijen`. */
  razlogOdbijanja?: string | null;
  /**
   * Brend je verifikovan — proizvodi poslani na odobrenje se odmah objavljuju
   * (server sam odlučuje ishod, vidi `saveProductAction`). Utiče samo na
   * tekst dugmeta/napomene, ne na `ciljniStatus` koji se šalje serveru.
   */
  brandVerifikovan: boolean;
};

type PoljeProps = {
  id: PoljeProizvoda;
  label: string;
  obavezno?: boolean;
  greska?: string;
  pomoc?: string;
  brojac?: ReactNode;
  children: (opisao: { id: string; opisano?: string }) => ReactNode;
};

function Polje({ id, label, obavezno, greska, pomoc, brojac, children }: PoljeProps) {
  const idGreske = `${id}-greska`;
  const idPomoci = `${id}-pomoc`;
  const opisano = greska ? idGreske : pomoc ? idPomoci : undefined;
  const poruke = bs.portal.proizvodi.forma;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className={KLASE_LABELE}>
          {label} <span className="text-xs font-normal text-[#8A9086]">({obavezno ? poruke.obavezno : poruke.opciono})</span>
        </label>
        {brojac}
      </div>

      {children({ id, opisano })}

      {greska ? (
        <p id={idGreske} className="text-xs text-[#B3261E]">
          {greska}
        </p>
      ) : pomoc ? (
        <p id={idPomoci} className="text-xs text-[#1C2B22]/60">
          {pomoc}
        </p>
      ) : null}
    </div>
  );
}

export function ProizvodForma({
  brandId,
  productId,
  pocetneVrijednosti,
  kategorije,
  ciljevi,
  ponovnoOdobrenje,
  onemoguceno,
  status,
  razlogOdbijanja,
  brandVerifikovan,
}: ProizvodFormaProps) {
  const router = useRouter();
  const [vrijednosti, setVrijednosti] = useState<ProizvodUnos>(pocetneVrijednosti);
  const [greskePolja, setGreskePolja] = useState<GreskeProizvoda>({});
  const [greska, setGreska] = useState<string | null>(null);
  const [uspjeh, setUspjeh] = useState<CiljniStatus | null>(null);
  const [ciljUToku, setCiljUToku] = useState<CiljniStatus | null>(null);

  const saljeSe = ciljUToku !== null;
  const zakljucano = onemoguceno || saljeSe;
  const poruke = bs.portal.proizvodi.forma;

  function postavi<K extends PoljeProizvoda>(polje: K, vrijednost: ProizvodUnos[K]) {
    setVrijednosti((prethodne) => ({ ...prethodne, [polje]: vrijednost }));
    setUspjeh(null);
  }

  function preklopiKategoriju(id: string, oznaceno: boolean) {
    setVrijednosti((prethodne) => ({
      ...prethodne,
      kategorije: oznaceno
        ? [...prethodne.kategorije, id]
        : prethodne.kategorije.filter((postojeciId) => postojeciId !== id),
    }));
    setUspjeh(null);
  }

  function preklopiCilj(id: string, oznaceno: boolean) {
    setVrijednosti((prethodne) => ({
      ...prethodne,
      predlozeniCiljevi: oznaceno
        ? [...prethodne.predlozeniCiljevi, id]
        : prethodne.predlozeniCiljevi.filter((postojeciId) => postojeciId !== id),
    }));
    setUspjeh(null);
  }

  async function posalji(ciljniStatus: CiljniStatus, event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setGreska(null);
    setUspjeh(null);

    if (onemoguceno) {
      return;
    }

    const greske = validirajProizvod(vrijednosti, ciljniStatus);
    setGreskePolja(greske);

    if (Object.keys(greske).length > 0) {
      return;
    }

    setCiljUToku(ciljniStatus);

    try {
      const rezultat = await saveProductAction(brandId, productId, vrijednosti, ciljniStatus);

      if (!rezultat.ok) {
        setGreska(rezultat.error);
        return;
      }

      if (productId === null) {
        router.push(`/portal/proizvodi/${rezultat.productId}`);
        return;
      }

      // Slanje na odobrenje (ili direktno objavljivanje za verifikovane
      // brendove — vidi napomenaVerifikovan) postojećeg proizvoda vraća
      // brend na listu da prati status. "Sačuvaj kao nacrt" MORA ostati na
      // formi — brend često nastavlja uređivati odmah nakon snimanja.
      if (ciljniStatus === 'na_cekanju') {
        router.push('/portal/proizvodi');
        return;
      }

      setUspjeh(ciljniStatus);
      router.refresh();
    } catch {
      setGreska(poruke.greskaOpsta);
    } finally {
      setCiljUToku(null);
    }
  }

  const duzinaOpisa = vrijednosti.kratkiOpis.trim().length;

  return (
    <div className="flex flex-col gap-6">
      {status ? (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[#1C2B22]/60">{poruke.trenutniStatus}</span>
          <div>
            <span
              className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_KLASE[status]}`}
            >
              {bs.portal.proizvodi.status[status]}
            </span>
          </div>
          {status === 'odbijen' && razlogOdbijanja ? (
            <p className="text-xs text-[#B3261E]">{razlogOdbijanja}</p>
          ) : null}
        </div>
      ) : null}

      <form onSubmit={(event) => posalji('na_cekanju', event)} className="flex flex-col gap-6" noValidate>
        <fieldset disabled={zakljucano} className="flex flex-col gap-6 border-0 p-0">
          <section className={KLASE_KARTICE}>
            <h2 className="text-lg font-semibold text-[#1C2B22]">{poruke.sekcije.osnovno}</h2>

            <Polje id="naziv" label={poruke.polja.naziv} obavezno greska={greskePolja.naziv}>
              {({ id, opisano }) => (
                <input
                  id={id}
                  name={id}
                  type="text"
                  placeholder={poruke.polja.nazivPlaceholder}
                  value={vrijednosti.naziv}
                  onChange={(event) => postavi('naziv', event.target.value)}
                  aria-invalid={greskePolja.naziv ? true : undefined}
                  aria-describedby={opisano}
                  className={KLASE_POLJA}
                />
              )}
            </Polje>

            <Polje
              id="kratkiOpis"
              label={poruke.polja.kratkiOpis}
              obavezno
              greska={greskePolja.kratkiOpis}
              brojac={
                <span
                  className={
                    duzinaOpisa > MAX_KRATKI_OPIS ? 'text-xs text-[#B3261E]' : 'text-xs text-[#8A9086]'
                  }
                >
                  {poruke.brojac(duzinaOpisa, MAX_KRATKI_OPIS)}
                </span>
              }
            >
              {({ id, opisano }) => (
                <input
                  id={id}
                  name={id}
                  type="text"
                  placeholder={poruke.polja.kratkiOpisPlaceholder}
                  value={vrijednosti.kratkiOpis}
                  onChange={(event) => postavi('kratkiOpis', event.target.value)}
                  aria-invalid={greskePolja.kratkiOpis ? true : undefined}
                  aria-describedby={opisano}
                  className={KLASE_POLJA}
                />
              )}
            </Polje>

            <Polje
              id="opis"
              label={poruke.polja.opis}
              greska={greskePolja.opis}
              pomoc={poruke.polja.opisPomoc}
            >
              {({ id, opisano }) => (
                <textarea
                  id={id}
                  name={id}
                  rows={6}
                  placeholder={poruke.polja.opisPlaceholder}
                  value={vrijednosti.opis}
                  onChange={(event) => postavi('opis', event.target.value)}
                  aria-describedby={opisano}
                  className={`${KLASE_POLJA} resize-y`}
                />
              )}
            </Polje>

            <Polje id="forma" label={poruke.polja.forma} obavezno greska={greskePolja.forma}>
              {({ id, opisano }) => (
                <select
                  id={id}
                  name={id}
                  value={vrijednosti.forma}
                  onChange={(event) => postavi('forma', event.target.value)}
                  aria-invalid={greskePolja.forma ? true : undefined}
                  aria-describedby={opisano}
                  className={KLASE_POLJA}
                >
                  <option value="" disabled>
                    {poruke.polja.formaOdaberite}
                  </option>
                  {PRODUCT_FORME.map((forma) => (
                    <option key={forma} value={forma}>
                      {bs.shop.forme[forma]}
                    </option>
                  ))}
                </select>
              )}
            </Polje>
          </section>

          <section className={KLASE_KARTICE}>
            <h2 className="text-lg font-semibold text-[#1C2B22]">{poruke.sekcije.kategorija}</h2>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className={KLASE_LABELE}>
                  {poruke.polja.kategorije}{' '}
                  <span className="text-xs font-normal text-[#8A9086]">({poruke.obavezno})</span>
                </span>
              </div>

              <div className="flex flex-col gap-4">
                {kategorije.map((top) => (
                  <div key={top.id} className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-[#1C2B22]">{top.naziv}</span>
                    {top.podkategorije.length > 0 ? (
                      <div className="flex flex-wrap gap-x-5 gap-y-2 pl-1">
                        {top.podkategorije.map((pod) => (
                          <label
                            key={pod.id}
                            className="flex items-center gap-2 text-sm text-[#1C2B22]"
                          >
                            <input
                              type="checkbox"
                              checked={vrijednosti.kategorije.includes(pod.id)}
                              onChange={(event) => preklopiKategoriju(pod.id, event.target.checked)}
                              className="h-4 w-4 rounded border-[#1C2B22]/30 text-[#16332A] accent-[#16332A]"
                            />
                            {pod.naziv}
                          </label>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              {greskePolja.kategorije ? (
                <p className="text-xs text-[#B3261E]">{greskePolja.kategorije}</p>
              ) : (
                <p className="text-xs text-[#1C2B22]/60">{poruke.polja.kategorijePomoc}</p>
              )}
            </div>
          </section>

          <section className={KLASE_KARTICE}>
            <h2 className="text-lg font-semibold text-[#1C2B22]">{poruke.sekcije.ciljevi}</h2>

            <div className="flex flex-col gap-1.5">
              <span className={KLASE_LABELE}>
                {poruke.polja.predlozeniCiljevi}{' '}
                <span className="text-xs font-normal text-[#8A9086]">({poruke.opciono})</span>
              </span>

              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {ciljevi.map((cilj) => (
                  <label key={cilj.id} className="flex items-center gap-2 text-sm text-[#1C2B22]">
                    <input
                      type="checkbox"
                      checked={vrijednosti.predlozeniCiljevi.includes(cilj.id)}
                      onChange={(event) => preklopiCilj(cilj.id, event.target.checked)}
                      className="h-4 w-4 rounded border-[#1C2B22]/30 text-[#16332A] accent-[#16332A]"
                    />
                    {cilj.naziv}
                  </label>
                ))}
              </div>

              <p className="text-xs text-[#1C2B22]/60">{poruke.polja.predlozeniCiljeviPomoc}</p>
            </div>
          </section>

          <section className={KLASE_KARTICE}>
            <h2 className="text-lg font-semibold text-[#1C2B22]">{poruke.sekcije.detalji}</h2>

            <Polje id="sastojci" label={poruke.polja.sastojci} greska={greskePolja.sastojci}>
              {({ id, opisano }) => (
                <textarea
                  id={id}
                  name={id}
                  rows={4}
                  placeholder={poruke.polja.sastojciPlaceholder}
                  value={vrijednosti.sastojci}
                  onChange={(event) => postavi('sastojci', event.target.value)}
                  aria-describedby={opisano}
                  className={`${KLASE_POLJA} resize-y`}
                />
              )}
            </Polje>

            <Polje id="doziranje" label={poruke.polja.doziranje} greska={greskePolja.doziranje}>
              {({ id, opisano }) => (
                <input
                  id={id}
                  name={id}
                  type="text"
                  placeholder={poruke.polja.doziranjePlaceholder}
                  value={vrijednosti.doziranje}
                  onChange={(event) => postavi('doziranje', event.target.value)}
                  aria-describedby={opisano}
                  className={KLASE_POLJA}
                />
              )}
            </Polje>

            <Polje id="upozorenja" label={poruke.polja.upozorenja} greska={greskePolja.upozorenja}>
              {({ id, opisano }) => (
                <textarea
                  id={id}
                  name={id}
                  rows={4}
                  placeholder={poruke.polja.upozorenjaPlaceholder}
                  value={vrijednosti.upozorenja}
                  onChange={(event) => postavi('upozorenja', event.target.value)}
                  aria-describedby={opisano}
                  className={`${KLASE_POLJA} resize-y`}
                />
              )}
            </Polje>
          </section>

          <section className={KLASE_KARTICE}>
            <h2 className="text-lg font-semibold text-[#1C2B22]">{poruke.sekcije.cijena}</h2>

            <Polje id="cijenaKm" label={poruke.polja.cijena} obavezno greska={greskePolja.cijenaKm}>
              {({ id, opisano }) => (
                <input
                  id={id}
                  name={id}
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={vrijednosti.cijenaKm}
                  onChange={(event) => postavi('cijenaKm', event.target.value)}
                  aria-invalid={greskePolja.cijenaKm ? true : undefined}
                  aria-describedby={opisano}
                  className={KLASE_POLJA}
                />
              )}
            </Polje>

            <Polje
              id="staraCijenaKm"
              label={poruke.polja.staraCijena}
              greska={greskePolja.staraCijenaKm}
              pomoc={poruke.polja.staraCijenaPomoc}
            >
              {({ id, opisano }) => (
                <input
                  id={id}
                  name={id}
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={vrijednosti.staraCijenaKm}
                  onChange={(event) => postavi('staraCijenaKm', event.target.value)}
                  aria-invalid={greskePolja.staraCijenaKm ? true : undefined}
                  aria-describedby={opisano}
                  className={KLASE_POLJA}
                />
              )}
            </Polje>
          </section>

          <section className={KLASE_KARTICE}>
            <h2 className="text-lg font-semibold text-[#1C2B22]">{poruke.sekcije.dostupnost}</h2>

            <Polje id="dostupnost" label={poruke.polja.dostupnost} obavezno greska={greskePolja.dostupnost}>
              {({ id, opisano }) => (
                <select
                  id={id}
                  name={id}
                  value={vrijednosti.dostupnost}
                  onChange={(event) => postavi('dostupnost', event.target.value)}
                  aria-invalid={greskePolja.dostupnost ? true : undefined}
                  aria-describedby={opisano}
                  className={KLASE_POLJA}
                >
                  {PRODUCT_DOSTUPNOSTI.map((dostupnost) => (
                    <option key={dostupnost} value={dostupnost}>
                      {poruke.dostupnostOpcije[dostupnost]}
                    </option>
                  ))}
                </select>
              )}
            </Polje>
          </section>

          <section className={KLASE_KARTICE}>
            <label className="flex items-start gap-3 text-sm text-[#1C2B22]">
              <input
                type="checkbox"
                checked={vrijednosti.istaknutZahtjev}
                onChange={(event) => postavi('istaknutZahtjev', event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[#1C2B22]/30 text-[#16332A] accent-[#16332A]"
              />
              <span className="font-medium">{poruke.polja.istaknutZahtjev}</span>
            </label>
            <p className="text-xs text-[#1C2B22]/60">{poruke.polja.istaknutZahtjevPomoc}</p>
          </section>
        </fieldset>

        {ponovnoOdobrenje ? (
          <p className="rounded-xl bg-[#C7D6BA]/40 px-4 py-3 text-sm text-[#1C2B22]/80">
            {poruke.napomenaPonovnoOdobrenje}
          </p>
        ) : null}

        {brandVerifikovan ? (
          <p className="rounded-xl bg-[#C7D6BA]/40 px-4 py-3 text-sm text-[#1C2B22]/80">
            {poruke.napomenaVerifikovan}
          </p>
        ) : null}

        {uspjeh ? (
          <p role="status" className="rounded-xl bg-[#C7D6BA]/50 px-4 py-3 text-sm font-medium text-[#16332A]">
            {uspjeh === 'nacrt' ? poruke.uspjehNacrt : poruke.uspjehPoslano}
          </p>
        ) : null}

        {greska ? (
          <p role="alert" className="rounded-xl bg-[#B3261E]/10 px-4 py-3 text-sm text-[#B3261E]">
            {greska}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => posalji('nacrt')}
            disabled={zakljucano}
            className="inline-flex items-center justify-center rounded-full border border-[#1C2B22]/20 px-6 py-3 text-sm font-medium text-[#1C2B22] transition-colors hover:bg-[#F2F5ED] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {ciljUToku === 'nacrt' ? poruke.sacuvajUcitavanje : poruke.sacuvajNacrt}
          </button>

          <button
            type="submit"
            disabled={zakljucano}
            className="inline-flex items-center justify-center rounded-full bg-[#16332A] px-6 py-3 text-sm font-medium text-[#F2F5ED] transition-colors hover:bg-[#16332A]/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {ciljUToku === 'na_cekanju'
              ? poruke.sacuvajUcitavanje
              : brandVerifikovan
                ? poruke.objavi
                : poruke.posaljiNaOdobrenje}
          </button>
        </div>
      </form>
    </div>
  );
}
