import Link from 'next/link';
import type { Session } from 'next-auth';
import type { Brand } from '@/lib/db/schema';
import { bs } from '@/lib/i18n/bs';
import { KorisnickiMeni } from '@/app/(shop)/_components/KorisnickiMeni';

type PortalHeaderProps = {
  user: Session['user'];
  brand?: { naziv: string; status: Brand['status'] };
};

const STATUS_KLASE: Record<Brand['status'], string> = {
  na_cekanju: 'bg-[#C7D6BA]/50 text-[#1C2B22]',
  odobren: 'bg-[#16332A] text-[#F2F5ED]',
  suspendovan: 'bg-[#8A9086]/30 text-[#1C2B22]',
};

/**
 * Mini-header portala. Portal je unutrašnji alat, ne javni sajt — nema
 * korpe, kategorija ni Ritual Vodiča iz shop headera.
 */
export function PortalHeader({ user, brand }: PortalHeaderProps) {
  return (
    <header className="border-b border-[#1C2B22]/10 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/portal" className="shrink-0 text-lg font-semibold text-[#16332A]">
            {bs.portal.logo}
          </Link>

          {brand ? (
            <>
              <span aria-hidden="true" className="text-[#1C2B22]/20">
                /
              </span>
              <span className="truncate text-sm font-medium text-[#1C2B22]">{brand.naziv}</span>
              <span
                className={`hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-medium sm:inline ${STATUS_KLASE[brand.status]}`}
              >
                {bs.portal.status[brand.status]}
              </span>
            </>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/"
            className="hidden rounded-full border border-[#1C2B22]/20 px-4 py-2 text-sm font-medium text-[#1C2B22] transition-colors hover:bg-[#F2F5ED] sm:inline-flex"
          >
            {bs.portal.nazadNaSajt}
          </Link>
          <KorisnickiMeni user={user} />
        </div>
      </div>
    </header>
  );
}
