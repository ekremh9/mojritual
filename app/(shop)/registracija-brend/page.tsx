import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { bs } from '@/lib/i18n/bs';
import { RegistracijaBrendForma } from './_components/RegistracijaBrendForma';

export const metadata: Metadata = {
  title: bs.registracijaBrend.naslov,
  description: bs.registracijaBrend.podnaslov,
};

export default async function RegistracijaBrendPage() {
  const session = await auth();

  if (session) {
    redirect('/');
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-[400px] rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-[#1C2B22]">{bs.registracijaBrend.naslov}</h1>
          <p className="text-sm text-[#1C2B22]/70">{bs.registracijaBrend.podnaslov}</p>
        </div>

        <div className="mt-6">
          <RegistracijaBrendForma />
        </div>

        <p className="mt-6 text-center text-sm text-[#1C2B22]/70">
          {bs.registracijaBrend.imatePitanje}{' '}
          <Link href="/registracija" className="font-medium text-[#16332A] underline underline-offset-2">
            {bs.registracijaBrend.registrujteSeKaoKupac}
          </Link>
        </p>
      </div>
    </div>
  );
}
