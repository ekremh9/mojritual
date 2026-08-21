import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { bs } from '@/lib/i18n/bs';
import { PrijavaForma } from './_components/PrijavaForma';

type PrijavaPageProps = {
  searchParams: Promise<{ [kljuc: string]: string | string[] | undefined }>;
};

export const metadata: Metadata = {
  title: bs.prijava.naslov,
  description: bs.prijava.podnaslov,
};

/** Prihvata samo relativne putanje unutar aplikacije — bez otvorenog redirecta. */
function sigurniCallbackUrl(vrijednost: string | string[] | undefined): string {
  const putanja = Array.isArray(vrijednost) ? vrijednost[0] : vrijednost;

  if (
    !putanja ||
    !putanja.startsWith('/') ||
    putanja.startsWith('//') ||
    putanja.startsWith('/\\')
  ) {
    return '/';
  }

  return putanja;
}

export default async function PrijavaPage({ searchParams }: PrijavaPageProps) {
  const session = await auth();

  if (session) {
    redirect('/');
  }

  const { callbackUrl } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-[400px] rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-2">
          <h1 className="font-bodoni text-2xl font-semibold text-ritual-charcoal">{bs.prijava.naslov}</h1>
          <p className="text-sm text-ritual-charcoal/70">{bs.prijava.podnaslov}</p>
        </div>

        <div className="mt-6">
          <PrijavaForma callbackUrl={sigurniCallbackUrl(callbackUrl)} />
        </div>

        <p className="mt-6 text-center text-sm text-ritual-charcoal/70">
          {bs.prijava.nematePitanje}{' '}
          <Link
            href="/registracija"
            className="font-medium text-ritual-deep-green underline underline-offset-2"
          >
            {bs.prijava.registrujteSe}
          </Link>
        </p>
      </div>
    </div>
  );
}
