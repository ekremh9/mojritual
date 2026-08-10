import type { Metadata } from 'next';
import Link from 'next/link';
import { bs } from '@/lib/i18n/bs';

export const metadata: Metadata = {
  title: bs.portal.proizvodi.novi.naslov,
};

export default function PortalNoviProizvodPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-[#1C2B22]">{bs.portal.proizvodi.novi.naslov}</h1>
      </div>

      <div className="flex flex-col items-start gap-4 rounded-2xl border border-[#1C2B22]/10 bg-white p-6">
        <p className="text-sm text-[#1C2B22]/70">{bs.portal.proizvodi.novi.poruka}</p>
        <Link
          href="/portal/proizvodi"
          className="rounded-full border border-[#1C2B22]/20 px-4 py-2 text-sm font-medium text-[#1C2B22] transition-colors hover:bg-[#F2F5ED]"
        >
          {bs.portal.proizvodi.novi.nazad}
        </Link>
      </div>
    </div>
  );
}
