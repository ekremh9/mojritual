'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreVertical } from 'lucide-react';
import {
  deleteProductAction,
  unpublishProductAction,
} from '@/lib/domain/portal-product-actions';
import type { Product } from '@/lib/db/schema';
import { bs } from '@/lib/i18n/bs';

type ProizvodAkcijeProps = {
  productId: string;
  status: Product['status'];
  onemoguceno?: boolean;
  /**
   * Kuda nakon uspješnog brisanja — lista proizvoda više neće postojati na
   * stranici pojedinačnog proizvoda, pa ta stranica traži redirekciju
   * umjesto osvježavanja trenutne rute.
   */
  naBrisanje?: 'osvjezi' | 'nazadNaListu';
  /** Sakriva stavku "Uredi" — korisno kad je meni već na stranici uređivanja. */
  sakrijUredi?: boolean;
};

const STAVKA_KLASE =
  'block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[#1C2B22] transition-colors hover:bg-[#F2F5ED] disabled:cursor-not-allowed disabled:opacity-50';

export function ProizvodAkcije({
  productId,
  status,
  onemoguceno,
  naBrisanje = 'osvjezi',
  sakrijUredi,
}: ProizvodAkcijeProps) {
  const router = useRouter();
  const [otvoren, setOtvoren] = useState(false);
  const [uToku, setUToku] = useState<'povuci' | 'obrisi' | null>(null);
  const kontejnerRef = useRef<HTMLDivElement>(null);
  const poruke = bs.portal.proizvodi.akcije;

  useEffect(() => {
    if (!otvoren) {
      return;
    }

    function naKlikVan(event: MouseEvent) {
      if (kontejnerRef.current && !kontejnerRef.current.contains(event.target as Node)) {
        setOtvoren(false);
      }
    }

    document.addEventListener('mousedown', naKlikVan);
    return () => document.removeEventListener('mousedown', naKlikVan);
  }, [otvoren]);

  async function povuci() {
    if (!window.confirm(poruke.povuciPotvrda)) {
      return;
    }

    setOtvoren(false);
    setUToku('povuci');
    try {
      const rezultat = await unpublishProductAction(productId);
      if (!rezultat.ok) {
        window.alert(rezultat.error);
        return;
      }
      router.refresh();
    } catch {
      window.alert(poruke.greskaOpsta);
    } finally {
      setUToku(null);
    }
  }

  async function obrisi() {
    if (!window.confirm(poruke.obrisiPotvrda)) {
      return;
    }

    setOtvoren(false);
    setUToku('obrisi');
    try {
      const rezultat = await deleteProductAction(productId);
      if (!rezultat.ok) {
        window.alert(rezultat.error);
        return;
      }
      if (naBrisanje === 'nazadNaListu') {
        router.push('/portal/proizvodi');
        return;
      }
      router.refresh();
    } catch {
      window.alert(poruke.greskaOpsta);
    } finally {
      setUToku(null);
    }
  }

  return (
    <div ref={kontejnerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOtvoren((prethodno) => !prethodno)}
        aria-haspopup="menu"
        aria-expanded={otvoren}
        aria-label={poruke.otvoriMeni}
        disabled={uToku !== null}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#1C2B22]/70 transition-colors hover:bg-[#F2F5ED] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {otvoren && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-[#1C2B22]/10 bg-white p-2 shadow-lg"
        >
          {sakrijUredi ? null : (
            <Link
              href={`/portal/proizvodi/${productId}`}
              role="menuitem"
              className={STAVKA_KLASE}
              onClick={() => setOtvoren(false)}
            >
              {poruke.uredi}
            </Link>
          )}

          {status === 'odobren' ? (
            <button
              type="button"
              role="menuitem"
              onClick={povuci}
              disabled={onemoguceno || uToku !== null}
              className={STAVKA_KLASE}
            >
              {poruke.povuci}
            </button>
          ) : null}

          <button
            type="button"
            role="menuitem"
            onClick={obrisi}
            disabled={onemoguceno || uToku !== null}
            className={`${STAVKA_KLASE} text-[#B3261E]`}
          >
            {poruke.obrisi}
          </button>
        </div>
      )}
    </div>
  );
}
