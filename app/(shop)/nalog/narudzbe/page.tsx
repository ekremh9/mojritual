import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@/auth';
import type { Order } from '@/lib/db/schema';
import { getMojeNarudzbe } from '@/lib/domain/nalog';
import { formatCijena } from '@/lib/domain/format';
import { bs } from '@/lib/i18n/bs';

export const metadata: Metadata = {
  title: bs.nalog.narudzbeLista.naslov,
};

const STATUS_KLASE: Record<Order['status'], string> = {
  na_cekanju: 'bg-amber-100 text-amber-800',
  potvrdjeno: 'bg-ritual-green text-ritual-charcoal',
  djelimicno_poslano: 'bg-ritual-green text-ritual-charcoal',
  poslano: 'bg-ritual-deep-green/10 text-ritual-deep-green',
  isporuceno: 'bg-ritual-deep-green text-ritual-warm-white',
  otkazano: 'bg-[#B3261E]/10 text-[#B3261E]',
};

function formatDatum(datum: Date): string {
  return datum.toLocaleDateString('bs-BA', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default async function MojeNarudzbePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/prijava?callbackUrl=/nalog/narudzbe');
  }

  // session.user.id je iz auth() sesije, nikad sa klijenta — jedini filter
  // koji getMojeNarudzbe prima (vidi lib/domain/nalog.ts).
  const narudzbe = await getMojeNarudzbe(session.user.id);
  const poruke = bs.nalog.narudzbeLista;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/nalog"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ritual-charcoal/70 hover:text-ritual-charcoal"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {poruke.nazad}
      </Link>

      <h1 className="font-bodoni text-2xl font-semibold text-ritual-charcoal sm:text-3xl">{poruke.naslov}</h1>

      {narudzbe.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-ritual-green/30 px-6 py-16 text-center">
          <p className="text-base text-ritual-charcoal/70">{poruke.prazno}</p>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center rounded-full bg-ritual-deep-green px-6 py-2.5 text-sm font-medium text-ritual-warm-white transition-colors hover:bg-ritual-deep-green/90"
          >
            {poruke.pregledajPonudu}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {narudzbe.map((narudzba) => (
            <Link
              key={narudzba.broj}
              href={`/narudzba/${narudzba.broj}`}
              className="flex items-center justify-between gap-4 rounded-2xl border border-ritual-charcoal/10 bg-white p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-ritual-charcoal">{narudzba.broj}</span>
                <span className="text-xs text-ritual-charcoal/60">
                  {poruke.datum}: {formatDatum(narudzba.createdAt)}
                </span>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <span
                  className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_KLASE[narudzba.status]}`}
                >
                  {bs.admin.narudzbe.status[narudzba.status]}
                </span>
                <span className="text-sm font-medium text-ritual-charcoal">
                  {formatCijena(narudzba.ukupno)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
