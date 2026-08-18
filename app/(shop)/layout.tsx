import type { ReactNode } from 'react';
import { Header } from './_components/Header';
import { MobilnaTraka } from './_components/MobilnaTraka';

/**
 * Javni dio sajta. Header živi ovdje, a ne u root layoutu, da ga portal
 * brenda i admin panel ne naslijede — to su unutrašnji alati sa svojim
 * zaglavljem. Isto važi za `MobilnaTraka` (donja mobilna navigacija).
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
        pokvariti time što ih omota.
        pb-16: mjesto za fixed MobilnaTraka na mobitelu, da ne prekrije sadržaj pri dnu.
      */}
      <div className="flex flex-1 flex-col pb-16 sm:pb-0">{children}</div>
      <MobilnaTraka />
    </>
  );
}
