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
  brojArtikala: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
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
        setStavke(parsirajStavke(JSON.parse(sirovoStanje)));
      }
    } catch {
      // Neispravan/oštećen sadržaj u localStorage — korpa ostaje prazna.
    } finally {
      setUcitanoIzLocalStorage(true);
    }
  }, []);

  useEffect(() => {
    if (!ucitanoIzLocalStorage) {
      // Ne piši dok inicijalno čitanje ne završi — inače bi prazno početno
      // stanje prepisalo ono što je već sačuvano.
      return;
    }
    window.localStorage.setItem(KLJUC_LOCALSTORAGE, JSON.stringify(stavke));
  }, [stavke, ucitanoIzLocalStorage]);

  const dodajUKorpu = useCallback((productId: string, kolicina = 1) => {
    setStavke((prethodneStavke) => dodajStavku(prethodneStavke, productId, kolicina));
  }, []);

  const postaviKolicinu = useCallback((productId: string, kolicina: number) => {
    setStavke((prethodneStavke) => postaviKolicinuStavci(prethodneStavke, productId, kolicina));
  }, []);

  const ukloniStavku = useCallback((productId: string) => {
    setStavke((prethodneStavke) => ukloniStavkuIzListe(prethodneStavke, productId));
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      stavke,
      dodajUKorpu,
      postaviKolicinu,
      ukloniStavku,
      brojArtikala: izracunajBrojArtikala(stavke),
    }),
    [stavke, dodajUKorpu, postaviKolicinu, ukloniStavku],
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
