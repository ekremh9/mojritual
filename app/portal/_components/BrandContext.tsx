'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Brand } from '@/lib/db/schema';

/**
 * Samo ono što portalu treba za prikaz. Nikad puni red iz baze — provizija,
 * JIB i ostali komercijalni podaci ne idu na klijent bez potrebe.
 */
export type BrandInfo = {
  id: string;
  naziv: string;
  slug: string;
  status: Brand['status'];
};

const BrandContext = createContext<BrandInfo | null>(null);

export function BrandProvider({ brand, children }: { brand: BrandInfo; children: ReactNode }) {
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export function useBrand(): BrandInfo {
  const brand = useContext(BrandContext);

  if (!brand) {
    throw new Error('useBrand se može koristiti samo unutar <BrandProvider>.');
  }

  return brand;
}
