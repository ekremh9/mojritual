'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  brojArtikala as izracunajBrojArtikala,
  dodajStavku,
  parsirajStavke,
  postaviKolicinu as postaviKolicinuStavci,
  ukloniStavku as ukloniStavkuIzListe,
  type KorpaStavka,
} from '@/lib/domain/cart';

const KLJUC_LOCALSTORAGE = 'ritual-korpa';

type CartContextValue = {
  stavke: KorpaStavka[];
  dodajUKorpu: (productId: string, kolicina?: number) => void;
  postaviKolicinu: (productId: string, kolicina: number) => void;
  ukloniStavku: (productId: string) => void;
  clearCart: () => void;
  brojArtikala: number;
  /** Odobren partner — veći limit po stavci (vidi MAX_KOLICINA_PARTNER u cart.ts). */
  jePartner: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

type CartProviderProps = {
  children: ReactNode;
  /**
   * Odobren partner (`brands.status='odobren'`) — dolazi kao prop iz
   * root layouta (`app/layout.tsx`, server component preko `auth()` +
   * `jeOdobreniPartner`), NE iz nečeg što ovaj klijentski provider sam
   * utvrđuje. Korpa je globalna (mount-ovana za cijelu aplikaciju), pa
   * nema drugog pouzdanog načina da klijent sazna svoj partner status
   * bez posebnog API poziva za svaku promjenu količine — ovo je taj
   * status, dobiven JEDNOM, na inicijalnom server renderu stranice.
   */
  jePartner?: boolean;
};

export function CartProvider({ children, jePartner = false }: CartProviderProps) {
  const [stavke, setStavke] = useState<KorpaStavka[]>([]);
  const [ucitanoIzLocalStorage, setUcitanoIzLocalStorage] = useState(false);

  // localStorage nije dostupan na serveru — čita se tek nakon mounta, da se
  // izbjegne hydration mismatch (server i prvi klijentski render su prazni).
  useEffect(() => {
    try {
      const sirovoStanje = window.localStorage.getItem(KLJUC_LOCALSTORAGE);
      if (sirovoStanje) {
        // Inicijalno čitanje eksternog izvora (localStorage) nakon mounta —
        // namjerno sinhrono, jedini način da se izbjegne hydration mismatch.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStavke(parsirajStavke(JSON.parse(sirovoStanje), jePartner));
      }
    } catch {
      // Neispravan/oštećen sadržaj u localStorage — korpa ostaje prazna.
    } finally {
      setUcitanoIzLocalStorage(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ucitanoIzLocalStorage) {
      // Ne piši dok inicijalno čitanje ne završi — inače bi prazno početno
      // stanje prepisalo ono što je već sačuvano.
      return;
    }
    window.localStorage.setItem(KLJUC_LOCALSTORAGE, JSON.stringify(stavke));
  }, [stavke, ucitanoIzLocalStorage]);

  const dodajUKorpu = useCallback(
    (productId: string, kolicina = 1) => {
      setStavke((prethodneStavke) => dodajStavku(prethodneStavke, productId, kolicina, jePartner));
    },
    [jePartner],
  );

  const postaviKolicinu = useCallback(
    (productId: string, kolicina: number) => {
      setStavke((prethodneStavke) =>
        postaviKolicinuStavci(prethodneStavke, productId, kolicina, jePartner),
      );
    },
    [jePartner],
  );

  const ukloniStavku = useCallback((productId: string) => {
    setStavke((prethodneStavke) => ukloniStavkuIzListe(prethodneStavke, productId));
  }, []);

  // Poziva se nakon uspješne narudžbe — briše i stanje i localStorage, da se
  // izbjegne da korisnik slučajno naruči iste stavke dvaput.
  const clearCart = useCallback(() => {
    setStavke([]);
    try {
      window.localStorage.removeItem(KLJUC_LOCALSTORAGE);
    } catch {
      // localStorage nedostupan (npr. privatni mod) — stanje u memoriji je i dalje očišćeno.
    }
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      stavke,
      dodajUKorpu,
      postaviKolicinu,
      ukloniStavku,
      clearCart,
      brojArtikala: izracunajBrojArtikala(stavke),
      jePartner,
    }),
    [stavke, dodajUKorpu, postaviKolicinu, ukloniStavku, clearCart, jePartner],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart mora biti pozvan unutar CartProvider-a.');
  }
  return context;
}
