import type { Metadata } from 'next';
import Link from 'next/link';
import { bs } from '@/lib/i18n/bs';
import { ZaboravljenaLozinkaForma } from './_components/ZaboravljenaLozinkaForma';

export const metadata: Metadata = {
  title: bs.zaboravljenaLozinka.naslov,
};

export default function ZaboravljenaLozinkaPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-[400px] rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-2">
          <h1 className="font-bodoni text-2xl font-semibold text-ritual-charcoal">
            {bs.zaboravljenaLozinka.naslov}
          </h1>
          <p className="text-sm text-ritual-charcoal/70">{bs.zaboravljenaLozinka.podnaslov}</p>
        </div>

        <div className="mt-6">
          <ZaboravljenaLozinkaForma />
        </div>

        <p className="mt-6 text-center text-sm text-ritual-charcoal/70">
          <Link
            href="/prijava"
            className="font-medium text-ritual-deep-green underline underline-offset-2"
          >
            {bs.zaboravljenaLozinka.nazadNaPrijavu}
          </Link>
        </p>
      </div>
    </div>
  );
}
