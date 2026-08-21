import type { Metadata } from 'next';
import Link from 'next/link';
import { verifyEmailToken } from '@/lib/domain/email-verification';
import { bs } from '@/lib/i18n/bs';

type VerifikujEmailPageProps = {
  searchParams: Promise<{ [kljuc: string]: string | string[] | undefined }>;
};

export const metadata: Metadata = {
  title: bs.verifikacija.naslovUspjeh,
};

export default async function VerifikujEmailPage({ searchParams }: VerifikujEmailPageProps) {
  const { token } = await searchParams;
  const tokenVrijednost = Array.isArray(token) ? token[0] : token;

  const rezultat = tokenVrijednost
    ? await verifyEmailToken(tokenVrijednost)
    : { ok: false as const, error: bs.verifikacija.greskaNevazeci };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 sm:py-16">
      <div className="flex w-full max-w-[400px] flex-col items-center gap-4 rounded-2xl bg-white p-6 text-center shadow-sm sm:p-8">
        <p className="text-lg font-medium text-ritual-charcoal">
          {rezultat.ok ? bs.verifikacija.naslovUspjeh : rezultat.error}
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-ritual-deep-green px-6 py-3 text-sm font-medium text-ritual-warm-white transition-colors hover:bg-ritual-deep-green/90"
        >
          {bs.verifikacija.nazadNaPocetnu}
        </Link>
      </div>
    </div>
  );
}
