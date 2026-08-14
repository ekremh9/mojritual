import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { bs } from '@/lib/i18n/bs';
import { RegistracijaForma } from './_components/RegistracijaForma';

export const metadata: Metadata = {
  title: bs.registracija.naslov,
  description: bs.registracija.podnaslov,
};

export default async function RegistracijaPage() {
  const session = await auth();

  if (session) {
    redirect('/');
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-[400px] rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-[#1C2B22]">{bs.registracija.naslov}</h1>
          <p className="text-sm text-[#1C2B22]/70">{bs.registracija.podnaslov}</p>
        </div>

        <div className="mt-6">
          <RegistracijaForma />
        </div>

        <p className="mt-6 text-center text-sm text-[#1C2B22]/70">
          {bs.registracija.imatePitanje}{' '}
          <Link href="/prijava" className="font-medium text-[#16332A] underline underline-offset-2">
            {bs.registracija.prijaviteSe}
          </Link>
        </p>

        <p className="mt-2 text-center text-sm text-[#1C2B22]/70">
          {bs.registracija.predstavljateBrend}{' '}
          <Link
            href="/registracija-brend"
            className="font-medium text-[#16332A] underline underline-offset-2"
          >
            {bs.registracija.registrujteBrend}
          </Link>
        </p>
      </div>
    </div>
  );
}
