import type { ReactNode } from 'react';
import { Footer } from './_components/Footer';
import { Header } from './_components/Header';
import { MobilnaTraka } from './_components/MobilnaTraka';

/**
 * Javni dio sajta. Header, Footer i MobilnaTraka žive ovdje, a ne u root
 * layoutu, da ih portal brenda i admin panel ne naslijede — to su
 * unutrašnji alati sa svojim zaglavljem.
 */
export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      {/*
        flex flex-1 flex-col: prozirni prolaz kroz body-jev flex-col (vidi
        app/layout.tsx) — stranice poput /prijava, /registracija, /korpa
        oslanjaju se na to da su direktan flex item body-ja da bi njihov
        vlastiti flex-1 centrirao sadržaj vertikalno; ovaj div ne smije to
        pokvariti time što ih omota. Footer NIJE unutra — ide poslije, kao
        normalan sadržaj koji slijedi nakon (ne rasteže se, samo prati dužinu
        stranice).
      */}
      <div className="flex flex-1 flex-col">{children}</div>
      <Footer />
      {/* MobilnaTraka je fixed — uvijek preko Footera, ne dio ovog toka. */}
      <MobilnaTraka />
    </>
  );
}
