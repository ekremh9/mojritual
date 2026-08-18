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
  potvrdjeno: 'bg-[#C7D6BA] text-[#1C2B22]',
  djelimicno_poslano: 'bg-[#C7D6BA] text-[#1C2B22]',
  poslano: 'bg-[#16332A]/10 text-[#16332A]',
  isporuceno: 'bg-[#16332A] text-[#F2F5ED]',
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
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[#1C2B22]/70 hover:text-[#1C2B22]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {poruke.nazad}
      </Link>

      <h1 className="text-2xl font-semibold text-[#1C2B22] sm:text-3xl">{poruke.naslov}</h1>

      {narudzbe.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-[#C7D6BA]/30 px-6 py-16 text-center">
          <p className="text-base text-[#1C2B22]/70">{poruke.prazno}</p>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center rounded-full bg-[#16332A] px-6 py-2.5 text-sm font-medium text-[#F2F5ED] transition-colors hover:bg-[#16332A]/90"
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
              className="flex items-center justify-between gap-4 rounded-2xl border border-[#1C2B22]/10 bg-white p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-[#1C2B22]">{narudzba.broj}</span>
                <span className="text-xs text-[#1C2B22]/60">
                  {poruke.datum}: {formatDatum(narudzba.createdAt)}
                </span>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <span
                  className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_KLASE[narudzba.status]}`}
                >
                  {bs.admin.narudzbe.status[narudzba.status]}
                </span>
                <span className="text-sm font-medium text-[#1C2B22]">
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
