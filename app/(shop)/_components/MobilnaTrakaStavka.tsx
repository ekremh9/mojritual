'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type MobilnaTrakaStavkaProps = {
  href: string;
  label: string;
  /** Ikona se renderuje na serveru i prosljeđuje kao children. */
  children: ReactNode;
  /** Badge (npr. broj stavki u korpi) — pozicionira se preko ikone. */
  badge?: ReactNode;
};

/**
 * Tanak klijentski omotač oko `Link` — postoji samo zbog `usePathname`,
 * da se aktivna stavka istakne. Isti pattern kao `PortalNavLink`.
 */
export function MobilnaTrakaStavka({ href, label, children, badge }: MobilnaTrakaStavkaProps) {
  const putanja = usePathname();
  const aktivna = href === '/' ? putanja === '/' : putanja.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={aktivna ? 'page' : undefined}
      className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors ${
        aktivna ? 'text-ritual-deep-green' : 'text-[#8A9086]'
      }`}
    >
      <span className="relative flex items-center justify-center">
        {children}
        {badge}
      </span>
      <span>{label}</span>
    </Link>
  );
}
