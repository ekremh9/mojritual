'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, User } from 'lucide-react';
import { signOut } from 'next-auth/react';
import type { Session } from 'next-auth';
import { bs } from '@/lib/i18n/bs';
import { useCart } from '@/lib/cart/CartContext';

type KorisnickiMeniProps = {
  user: Session['user'];
  unreadCount: number;
};

export function KorisnickiMeni({ user, unreadCount }: KorisnickiMeniProps) {
  const [otvoren, setOtvoren] = useState(false);
  const kontejnerRef = useRef<HTMLDivElement>(null);
  const { clearCart } = useCart();

  useEffect(() => {
    if (!otvoren) {
      return;
    }

    function naKlikVan(event: MouseEvent) {
      if (kontejnerRef.current && !kontejnerRef.current.contains(event.target as Node)) {
        setOtvoren(false);
      }
    }

    function naTipku(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOtvoren(false);
      }
    }

    document.addEventListener('mousedown', naKlikVan);
    document.addEventListener('keydown', naTipku);

    return () => {
      document.removeEventListener('mousedown', naKlikVan);
      document.removeEventListener('keydown', naTipku);
    };
  }, [otvoren]);

  const prikazanoIme = user.name ?? user.email ?? '';
  // Admin obavještenja nisu u obimu za sada — stavka se izostavlja.
  const obavjestenjaHref =
    user.role === 'customer' ? '/nalog/obavjestenja' : user.role === 'brand' ? '/portal/obavjestenja' : null;
  const stavkaKlase =
    'block rounded-lg px-3 py-2 text-sm font-medium text-[#1C2B22] transition-colors hover:bg-[#F2F5ED]';

  return (
    <div ref={kontejnerRef} className="relative">
      <button
        type="button"
        onClick={() => setOtvoren((prethodno) => !prethodno)}
        aria-haspopup="menu"
        aria-expanded={otvoren}
        aria-label={bs.korisnickiMeni.otvoriMeni}
        className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[#1C2B22] transition-colors hover:bg-[#F2F5ED]"
      >
        <span className="relative inline-flex">
          <User className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#B3261E] text-[10px] font-medium text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null}
        </span>
        <span className="hidden max-w-[10rem] truncate sm:inline">{prikazanoIme}</span>
        <ChevronDown className="hidden h-4 w-4 sm:inline" />
      </button>

      {otvoren && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-[#1C2B22]/10 bg-white p-2 shadow-lg"
        >
          <div className="border-b border-[#1C2B22]/10 px-3 pb-3 pt-2">
            {user.name && (
              <p className="truncate text-sm font-semibold text-[#16332A]">{user.name}</p>
            )}
            {user.email && (
              <p className="truncate text-xs text-[#1C2B22]/70">{user.email}</p>
            )}
          </div>

          <div className="pt-2">
            {obavjestenjaHref ? (
              <Link
                href={obavjestenjaHref}
                role="menuitem"
                className={stavkaKlase}
                onClick={() => setOtvoren(false)}
              >
                {bs.korisnickiMeni.obavjestenja(unreadCount)}
              </Link>
            ) : null}
            <Link href="/nalog" role="menuitem" className={stavkaKlase} onClick={() => setOtvoren(false)}>
              {bs.korisnickiMeni.mojNalog}
            </Link>
            <Link
              href="/nalog/narudzbe"
              role="menuitem"
              className={stavkaKlase}
              onClick={() => setOtvoren(false)}
            >
              {bs.korisnickiMeni.mojeNarudzbe}
            </Link>

            {user.role === 'admin' && (
              <Link
                href="/admin"
                role="menuitem"
                className={stavkaKlase}
                onClick={() => setOtvoren(false)}
              >
                {bs.korisnickiMeni.adminPanel}
              </Link>
            )}

            {user.role === 'brand' && (
              <Link
                href="/portal"
                role="menuitem"
                className={stavkaKlase}
                onClick={() => setOtvoren(false)}
              >
                {bs.korisnickiMeni.portalBrenda}
              </Link>
            )}
          </div>

          <div className="mt-2 border-t border-[#1C2B22]/10 pt-2">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOtvoren(false);
                clearCart();
                void signOut({ callbackUrl: '/' });
              }}
              className={`${stavkaKlase} w-full text-left`}
            >
              {bs.korisnickiMeni.odjava}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
