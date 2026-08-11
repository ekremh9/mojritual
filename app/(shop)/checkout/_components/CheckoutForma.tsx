'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart/CartContext';
import type { KorpaStavka } from '@/lib/domain/cart';
import { createOrderAction } from '@/lib/domain/order-actions';
import {
  normalizujCheckoutUnos,
  validirajCheckoutUnos,
  type CheckoutUnos,
  type GreskeCheckouta,
  type PoljeCheckouta,
} from '@/lib/domain/order-form';
import { bs } from '@/lib/i18n/bs';

const KLASE_POLJA =
  'w-full rounded-xl border border-[#1C2B22]/15 bg-white px-4 py-2.5 text-sm text-[#1C2B22] outline-none transition placeholder:text-[#1C2B22]/40 focus:border-[#16332A] focus:ring-2 focus:ring-[#16332A]/20 disabled:cursor-not-allowed disabled:bg-[#F2F5ED] disabled:text-[#1C2B22]/60';

const KLASE_LABELE = 'text-sm font-medium text-[#1C2B22]';

const KLASE_KARTICE = 'flex flex-col gap-4 rounded-2xl border border-[#1C2B22]/10 bg-white p-5';

const PRAZAN_UNOS: CheckoutUnos = {
  ime: '',
  email: '',
  telefon: '',
  adresa: '',
  grad: '',
  postanskiBroj: '',
  napomena: '',
};

type CheckoutFormaProps = {
  /** productId + kolicina iz korpe — cijene se nikad ne šalju sa klijenta. */
  stavke: KorpaStavka[];
  onNarudzbaPoslata?: () => void;
};

type PoljeProps = {
  id: PoljeCheckouta;
  label: string;
  obavezno?: boolean;
  greska?: string;
  children: (opisao: { id: string; opisano?: string }) => ReactNode;
};

function Polje({ id, label, obavezno, greska, children }: PoljeProps) {
  const idGreske = `${id}-greska`;
  const opisano = greska ? idGreske : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={KLASE_LABELE}>
        {label}{' '}
        <span className="text-xs font-normal text-[#8A9086]">
          ({obavezno ? bs.checkout.forma.obavezno : bs.checkout.forma.opciono})
        </span>
      </label>

      {children({ id, opisano })}

      {greska ? (
        <p id={idGreske} className="text-xs text-[#B3261E]">
          {greska}
        </p>
      ) : null}
    </div>
  );
}

export function CheckoutForma({ stavke, onNarudzbaPoslata }: CheckoutFormaProps) {
  const router = useRouter();
  const { clearCart } = useCart();
  const [vrijednosti, setVrijednosti] = useState<CheckoutUnos>(PRAZAN_UNOS);
  const [greskePolja, setGreskePolja] = useState<GreskeCheckouta>({});
  const [greska, setGreska] = useState<string | null>(null);
  const [saljeSe, setSaljeSe] = useState(false);

  const poruke = bs.checkout.forma;

  function postavi<K extends PoljeCheckouta>(polje: K, vrijednost: CheckoutUnos[K]) {
    setVrijednosti((prethodne) => ({ ...prethodne, [polje]: vrijednost }));
  }

  async function posalji(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGreska(null);

    const unos = normalizujCheckoutUnos(vrijednosti);
    const greske = validirajCheckoutUnos(unos);
    setGreskePolja(greske);

    if (Object.keys(greske).length > 0) {
      return;
    }

    setSaljeSe(true);

    try {
      const rezultat = await createOrderAction(unos, stavke);

      if (!rezultat.ok) {
        setGreska(rezultat.error);
        return;
      }

      onNarudzbaPoslata?.();
      router.push(`/narudzba/${rezultat.orderBroj}`);
      clearCart();
    } catch {
      setGreska(bs.checkout.greskaOpsta);
    } finally {
      setSaljeSe(false);
    }
  }

  return (
    <form onSubmit={posalji} className="flex flex-col gap-6" noValidate>
      <fieldset disabled={saljeSe} className="flex flex-col gap-6 border-0 p-0">
        <section className={KLASE_KARTICE}>
          <h2 className="text-lg font-semibold text-[#1C2B22]">{poruke.naslov}</h2>

          <Polje id="ime" label={poruke.polja.ime} obavezno greska={greskePolja.ime}>
            {({ id, opisano }) => (
              <input
                id={id}
                name={id}
                type="text"
                autoComplete="name"
                placeholder={poruke.polja.imePlaceholder}
                value={vrijednosti.ime}
                onChange={(event) => postavi('ime', event.target.value)}
                aria-invalid={greskePolja.ime ? true : undefined}
                aria-describedby={opisano}
                className={KLASE_POLJA}
              />
            )}
          </Polje>

          <Polje id="email" label={poruke.polja.email} obavezno greska={greskePolja.email}>
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

          <Polje id="telefon" label={poruke.polja.telefon} obavezno greska={greskePolja.telefon}>
            {({ id, opisano }) => (
              <input
                id={id}
                name={id}
                type="tel"
                autoComplete="tel"
                placeholder={poruke.polja.telefonPlaceholder}
                value={vrijednosti.telefon}
                onChange={(event) => postavi('telefon', event.target.value)}
                aria-invalid={greskePolja.telefon ? true : undefined}
                aria-describedby={opisano}
                className={KLASE_POLJA}
              />
            )}
          </Polje>

          <Polje id="adresa" label={poruke.polja.adresa} obavezno greska={greskePolja.adresa}>
            {({ id, opisano }) => (
              <input
                id={id}
                name={id}
                type="text"
                autoComplete="street-address"
                placeholder={poruke.polja.adresaPlaceholder}
                value={vrijednosti.adresa}
                onChange={(event) => postavi('adresa', event.target.value)}
                aria-invalid={greskePolja.adresa ? true : undefined}
                aria-describedby={opisano}
                className={KLASE_POLJA}
              />
            )}
          </Polje>

          <div className="grid grid-cols-2 gap-4">
            <Polje id="grad" label={poruke.polja.grad} obavezno greska={greskePolja.grad}>
              {({ id, opisano }) => (
                <input
                  id={id}
                  name={id}
                  type="text"
                  autoComplete="address-level2"
                  placeholder={poruke.polja.gradPlaceholder}
                  value={vrijednosti.grad}
                  onChange={(event) => postavi('grad', event.target.value)}
                  aria-invalid={greskePolja.grad ? true : undefined}
                  aria-describedby={opisano}
                  className={KLASE_POLJA}
                />
              )}
            </Polje>

            <Polje
              id="postanskiBroj"
              label={poruke.polja.postanskiBroj}
              obavezno
              greska={greskePolja.postanskiBroj}
            >
              {({ id, opisano }) => (
                <input
                  id={id}
                  name={id}
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder={poruke.polja.postanskiBrojPlaceholder}
                  value={vrijednosti.postanskiBroj}
                  onChange={(event) => postavi('postanskiBroj', event.target.value)}
                  aria-invalid={greskePolja.postanskiBroj ? true : undefined}
                  aria-describedby={opisano}
                  className={KLASE_POLJA}
                />
              )}
            </Polje>
          </div>

          <Polje id="napomena" label={poruke.polja.napomena} greska={greskePolja.napomena}>
            {({ id, opisano }) => (
              <textarea
                id={id}
                name={id}
                rows={3}
                placeholder={poruke.polja.napomenaPlaceholder}
                value={vrijednosti.napomena}
                onChange={(event) => postavi('napomena', event.target.value)}
                aria-describedby={opisano}
                className={`${KLASE_POLJA} resize-y`}
              />
            )}
          </Polje>
        </section>

        <section className={KLASE_KARTICE}>
          <h2 className="text-lg font-semibold text-[#1C2B22]">{bs.checkout.placanje.naslov}</h2>
          <div className="flex items-center gap-2.5 rounded-xl border border-[#16332A]/30 bg-[#C7D6BA]/30 px-4 py-3 text-sm text-[#1C2B22]">
            <span
              className="h-4 w-4 shrink-0 rounded-full border-[5px] border-[#16332A]"
              aria-hidden="true"
            />
            {bs.checkout.placanje.pouzece}
          </div>
        </section>
      </fieldset>

      {greska ? (
        <p role="alert" className="rounded-xl bg-[#B3261E]/10 px-4 py-3 text-sm text-[#B3261E]">
          {greska}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={saljeSe}
        className="inline-flex items-center justify-center rounded-full bg-[#16332A] px-6 py-3 text-sm font-medium text-[#F2F5ED] transition-colors hover:bg-[#16332A]/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saljeSe ? poruke.dugmeUcitavanje : poruke.dugme}
      </button>
    </form>
  );
}
