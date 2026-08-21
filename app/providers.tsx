'use client';

import type { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { CartProvider } from '@/lib/cart/CartContext';

type ProvidersProps = {
  children: ReactNode;
  /** Odobren partner — vidi CartProvider. Izračunato na serveru u app/layout.tsx. */
  jePartner: boolean;
};

export function Providers({ children, jePartner }: ProvidersProps) {
  return (
    <SessionProvider>
      <CartProvider jePartner={jePartner}>{children}</CartProvider>
    </SessionProvider>
  );
}
