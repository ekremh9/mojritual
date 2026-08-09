'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  MAX_KRATKI_OPIS,
  validirajBrandProfil,
  type BrandProfilUnos,
  type GreskeProfila,
  type PoljeProfila,
} from '@/lib/domain/brand-profile';
import { updateBrandProfile } from '@/lib/domain/portal-actions';
import { bs } from '@/lib/i18n/bs';

const KLASE_POLJA =
  'w-full rounded-xl border border-[#1C2B22]/15 bg-white px-4 py-2.5 text-sm text-[#1C2B22] outline-none transition placeholder:text-[#1C2B22]/40 focus:border-[#16332A] focus:ring-2 focus:ring-[#16332A]/20 disabled:cursor-not-allowed disabled:bg-[#F2F5ED] disabled:text-[#1C2B22]/60';

const KLASE_LABELE = 'text-sm font-medium text-[#1C2B22]';

const KLASE_KARTICE = 'flex flex-col gap-4 rounded-2xl border border-[#1C2B22]/10 bg-white p-5';

type ProfilFormaProps = {
  brandId: string;
  pocetneVrijednosti: BrandProfilUnos;
  /** Brend je suspendovan — forma se prikazuje, ali se ne može mijenjati. */
  onemoguceno: boolean;
};

type PoljeProps = {
  id: PoljeProfila;
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

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className={KLASE_LABELE}>
          {label}{' '}
          <span className="text-xs font-normal text-[#8A9086]">
            ({obavezno ? bs.portal.profil.obavezno : bs.portal.profil.opciono})
          </span>
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

export function ProfilForma({ brandId, pocetneVrijednosti, onemoguceno }: ProfilFormaProps) {
  const router = useRouter();
  const [vrijednosti, setVrijednosti] = useState<BrandProfilUnos>(pocetneVrijednosti);
  const [greskePolja, setGreskePolja] = useState<GreskeProfila>({});
  const [greska, setGreska] = useState<string | null>(null);
  const [uspjeh, setUspjeh] = useState(false);
  const [saljeSe, setSaljeSe] = useState(false);

  const zakljucano = onemoguceno || saljeSe;
  const poruke = bs.portal.profil;

  function postavi<K extends PoljeProfila>(polje: K, vrijednost: BrandProfilUnos[K]) {
    setVrijednosti((prethodne) => ({ ...prethodne, [polje]: vrijednost }));
    setUspjeh(false);
  }

  async function posalji(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGreska(null);
    setUspjeh(false);

    if (onemoguceno) {
      return;
    }

    const greske = validirajBrandProfil(vrijednosti);
    setGreskePolja(greske);

    if (Object.keys(greske).length > 0) {
      return;
    }

    setSaljeSe(true);

    try {
      const rezultat = await updateBrandProfile(brandId, vrijednosti);

      if (!rezultat.ok) {
        setGreska(rezultat.error);
        return;
      }

      setUspjeh(true);
      router.refresh();
    } catch {
      setGreska(poruke.greskaOpsta);
    } finally {
      setSaljeSe(false);
    }
  }

  const duzinaOpisa = vrijednosti.kratkiOpis.trim().length;

  return (
    <form onSubmit={posalji} className="flex flex-col gap-6" noValidate>
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
                  duzinaOpisa > MAX_KRATKI_OPIS
                    ? 'text-xs text-[#B3261E]'
                    : 'text-xs text-[#8A9086]'
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
            id="prica"
            label={poruke.polja.prica}
            greska={greskePolja.prica}
            pomoc={poruke.polja.pricaPomoc}
          >
            {({ id, opisano }) => (
              <textarea
                id={id}
                name={id}
                rows={8}
                placeholder={poruke.polja.pricaPlaceholder}
                value={vrijednosti.prica}
                onChange={(event) => postavi('prica', event.target.value)}
                aria-describedby={opisano}
                className={`${KLASE_POLJA} resize-y`}
              />
            )}
          </Polje>
        </section>

        <section className={KLASE_KARTICE}>
          <h2 className="text-lg font-semibold text-[#1C2B22]">{poruke.sekcije.kontakt}</h2>

          <Polje id="web" label={poruke.polja.web} greska={greskePolja.web}>
            {({ id, opisano }) => (
              <input
                id={id}
                name={id}
                type="url"
                inputMode="url"
                placeholder={poruke.polja.webPlaceholder}
                value={vrijednosti.web}
                onChange={(event) => postavi('web', event.target.value)}
                aria-invalid={greskePolja.web ? true : undefined}
                aria-describedby={opisano}
                className={KLASE_POLJA}
              />
            )}
          </Polje>

          <Polje id="email" label={poruke.polja.email} greska={greskePolja.email}>
            {({ id, opisano }) => (
              <input
                id={id}
                name={id}
                type="email"
                autoComplete="email"
                placeholder={poruke.polja.emailPlaceholder}
                value={vrijednosti.email}
                onChange={(event) => postavi('email', event.target.value)}
                aria-invalid={greskePolja.email ? true : undefined}
                aria-describedby={opisano}
                className={KLASE_POLJA}
              />
            )}
          </Polje>

          <Polje id="telefon" label={poruke.polja.telefon} greska={greskePolja.telefon}>
            {({ id, opisano }) => (
              <input
                id={id}
                name={id}
                type="tel"
                autoComplete="tel"
                placeholder={poruke.polja.telefonPlaceholder}
                value={vrijednosti.telefon}
                onChange={(event) => postavi('telefon', event.target.value)}
                aria-describedby={opisano}
                className={KLASE_POLJA}
              />
            )}
          </Polje>
        </section>

        <section className={KLASE_KARTICE}>
          <h2 className="text-lg font-semibold text-[#1C2B22]">{poruke.sekcije.pravni}</h2>

          <Polje
            id="jib"
            label={poruke.polja.jib}
            obavezno
            greska={greskePolja.jib}
            pomoc={poruke.polja.jibPomoc}
          >
            {({ id, opisano }) => (
              <input
                id={id}
                name={id}
                type="text"
                inputMode="numeric"
                value={vrijednosti.jib}
                onChange={(event) => postavi('jib', event.target.value)}
                aria-invalid={greskePolja.jib ? true : undefined}
                aria-describedby={opisano}
                className={KLASE_POLJA}
              />
            )}
          </Polje>

          <Polje id="pdvBroj" label={poruke.polja.pdvBroj} greska={greskePolja.pdvBroj}>
            {({ id, opisano }) => (
              <input
                id={id}
                name={id}
                type="text"
                inputMode="numeric"
                value={vrijednosti.pdvBroj}
                onChange={(event) => postavi('pdvBroj', event.target.value)}
                aria-describedby={opisano}
                className={KLASE_POLJA}
              />
            )}
          </Polje>

          <Polje id="adresa" label={poruke.polja.adresa} greska={greskePolja.adresa}>
            {({ id, opisano }) => (
              <input
                id={id}
                name={id}
                type="text"
                autoComplete="street-address"
                value={vrijednosti.adresa}
                onChange={(event) => postavi('adresa', event.target.value)}
                aria-describedby={opisano}
                className={KLASE_POLJA}
              />
            )}
          </Polje>
        </section>

        <section className={KLASE_KARTICE}>
          <h2 className="text-lg font-semibold text-[#1C2B22]">{poruke.sekcije.dostava}</h2>

          <Polje
            id="cijenaDostaveKm"
            label={poruke.polja.cijenaDostave}
            obavezno
            greska={greskePolja.cijenaDostaveKm}
            pomoc={poruke.polja.cijenaDostavePomoc}
          >
            {({ id, opisano }) => (
              <input
                id={id}
                name={id}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={vrijednosti.cijenaDostaveKm}
                onChange={(event) => postavi('cijenaDostaveKm', event.target.value)}
                aria-invalid={greskePolja.cijenaDostaveKm ? true : undefined}
                aria-describedby={opisano}
                className={KLASE_POLJA}
              />
            )}
          </Polje>

          <Polje
            id="pragBesplatneDostaveKm"
            label={poruke.polja.pragBesplatneDostave}
            greska={greskePolja.pragBesplatneDostaveKm}
            pomoc={poruke.polja.pragPomoc}
          >
            {({ id, opisano }) => (
              <input
                id={id}
                name={id}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={vrijednosti.nemaBesplatneDostave ? '' : vrijednosti.pragBesplatneDostaveKm}
                onChange={(event) => postavi('pragBesplatneDostaveKm', event.target.value)}
                disabled={vrijednosti.nemaBesplatneDostave}
                aria-invalid={greskePolja.pragBesplatneDostaveKm ? true : undefined}
                aria-describedby={opisano}
                className={KLASE_POLJA}
              />
            )}
          </Polje>

          <label className="flex items-center gap-2.5 text-sm text-[#1C2B22]">
            <input
              type="checkbox"
              name="nemaBesplatneDostave"
              checked={vrijednosti.nemaBesplatneDostave}
              onChange={(event) => postavi('nemaBesplatneDostave', event.target.checked)}
              className="h-4 w-4 rounded border-[#1C2B22]/30 text-[#16332A] accent-[#16332A]"
            />
            {poruke.polja.nemaBesplatneDostave}
          </label>
        </section>
      </fieldset>

      {uspjeh ? (
        <p
          role="status"
          className="rounded-xl bg-[#C7D6BA]/50 px-4 py-3 text-sm font-medium text-[#16332A]"
        >
          {poruke.uspjeh}
        </p>
      ) : null}

      {greska ? (
        <p role="alert" className="rounded-xl bg-[#B3261E]/10 px-4 py-3 text-sm text-[#B3261E]">
          {greska}
        </p>
      ) : null}

      <div>
        <button
          type="submit"
          disabled={zakljucano}
          className="inline-flex items-center justify-center rounded-full bg-[#16332A] px-6 py-3 text-sm font-medium text-[#F2F5ED] transition-colors hover:bg-[#16332A]/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saljeSe ? poruke.sacuvajUcitavanje : poruke.sacuvaj}
        </button>
      </div>
    </form>
  );
}
