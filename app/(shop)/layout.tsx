import type { ReactNode } from 'react';
import { Header } from './_components/Header';

/**
 * Javni dio sajta. Header živi ovdje, a ne u root layoutu, da ga portal
 * brenda i admin panel ne naslijede — to su unutrašnji alati sa svojim
 * zaglavljem.
 */
export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
