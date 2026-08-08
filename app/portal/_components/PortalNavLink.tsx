'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type PortalNavLinkProps = {
  href: string;
  label: string;
  /** Ikona se renderuje na serveru i prosljeđuje kao children. */
  children: ReactNode;
};

/**
 * Tanak klijentski omotač oko `Link` — postoji samo zbog `usePathname`,
 * da se aktivna stavka istakne. Sama navigacija ostaje server komponenta.
 */
export function PortalNavLink({ href, label, children }: PortalNavLinkProps) {
  const putanja = usePathname();
  const aktivna = href === '/portal' ? putanja === '/portal' : putanja.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={aktivna ? 'page' : undefined}
      className={`flex shrink-0 items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-medium transition-colors sm:rounded-xl ${
        aktivna
          ? 'bg-[#16332A] text-[#F2F5ED]'
          : 'text-[#1C2B22] hover:bg-[#C7D6BA]/40'
      }`}
    >
      {children}
      <span>{label}</span>
    </Link>
  );
}
