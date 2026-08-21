import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ClipboardList, Sparkles } from 'lucide-react';
import { auth } from '@/auth';
import { getNalogPregled } from '@/lib/domain/nalog';
import { bs } from '@/lib/i18n/bs';
import { ImeForma } from './_components/ImeForma';

export const metadata: Metadata = {
  title: bs.nalog.naslov,
};

export default async function NalogPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/prijava?callbackUrl=/nalog');
  }

  // session.user.id je iz auth() sesije, nikad sa klijenta — jedini filter
  // koji getNalogPregled prima (vidi lib/domain/nalog.ts).
  const pregled = await getNalogPregled(session.user.id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="font-bodoni text-2xl font-semibold text-ritual-charcoal sm:text-3xl">{bs.nalog.naslov}</h1>

      <section className="flex flex-col gap-4 rounded-2xl border border-ritual-charcoal/10 bg-white p-5">
        <h2 className="font-bodoni text-lg font-semibold text-ritual-charcoal">{bs.nalog.podaci.naslov}</h2>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ritual-charcoal">{bs.nalog.podaci.email}</span>
          <p className="w-full rounded-xl border border-ritual-charcoal/10 bg-ritual-beige px-4 py-2.5 text-sm text-ritual-charcoal/70">
            {session.user.email}
          </p>
          <p className="text-xs text-ritual-charcoal/60">{bs.nalog.podaci.emailNapomena}</p>
        </div>

        <ImeForma pocetnoIme={session.user.name ?? ''} />
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/nalog/narudzbe"
          className="flex items-center gap-3 rounded-2xl border border-ritual-charcoal/10 bg-white p-5 transition-shadow hover:shadow-md"
        >
          <ClipboardList className="h-5 w-5 shrink-0 text-ritual-deep-green" aria-hidden="true" />
          <span className="text-sm font-medium text-ritual-charcoal">
            {bs.nalog.narudzbe.naslov(pregled.brojNarudzbi)}
          </span>
        </Link>

        <Link
          href="/nalog/vodic"
          className="flex items-center gap-3 rounded-2xl border border-ritual-charcoal/10 bg-white p-5 transition-shadow hover:shadow-md"
        >
          <Sparkles className="h-5 w-5 shrink-0 text-ritual-deep-green" aria-hidden="true" />
          <span className="text-sm font-medium text-ritual-charcoal">
            {bs.nalog.vodic.naslov(pregled.brojSacuvanihVodica)}
          </span>
        </Link>
      </div>
    </div>
  );
}
