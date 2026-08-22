import type { Metadata } from 'next';
import Link from 'next/link';
import { verifyResetToken } from '@/lib/domain/password-reset';
import { bs } from '@/lib/i18n/bs';
import { ResetLozinkeForma } from './_components/ResetLozinkeForma';

type ResetLozinkePageProps = {
  searchParams: Promise<{ [kljuc: string]: string | string[] | undefined }>;
};

export const metadata: Metadata = {
  title: bs.resetLozinke.naslov,
};

export default async function ResetLozinkePage({ searchParams }: ResetLozinkePageProps) {
  const { token } = await searchParams;
  const tokenVrijednost = Array.isArray(token) ? token[0] : token;

  const provjera = tokenVrijednost
    ? await verifyResetToken(tokenVrijednost)
    : ({ valid: false, error: bs.resetLozinke.greskaTokenNevazeci } as const);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-[400px] rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        {!provjera.valid ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-[#B3261E]">{provjera.error}</p>
            <Link
              href="/zaboravljena-lozinka"
              className="inline-flex items-center justify-center rounded-full bg-ritual-deep-green px-6 py-3 text-sm font-medium text-ritual-warm-white transition-colors hover:bg-ritual-deep-green/90"
            >
              {bs.resetLozinke.zatraziNovi}
            </Link>
          </div>
        ) : tokenVrijednost ? (
          <>
            <div className="flex flex-col gap-2">
              <h1 className="font-bodoni text-2xl font-semibold text-ritual-charcoal">
                {bs.resetLozinke.naslov}
              </h1>
              <p className="text-sm text-ritual-charcoal/70">{bs.resetLozinke.podnaslov}</p>
            </div>

            <div className="mt-6">
              <ResetLozinkeForma token={tokenVrijednost} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
