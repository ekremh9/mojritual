import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@/auth';
import { getMojiVodicRezultati } from '@/lib/domain/nalog';
import { bs } from '@/lib/i18n/bs';

export const metadata: Metadata = {
  title: bs.nalog.vodicLista.naslov,
};

function formatDatum(datum: Date): string {
  return datum.toLocaleDateString('bs-BA', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default async function MojiVodicRezultatiPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/prijava?callbackUrl=/nalog/vodic');
  }

  // session.user.id je iz auth() sesije, nikad sa klijenta — jedini filter
  // koji getMojiVodicRezultati prima (uz sacuvano=true, vidi lib/domain/nalog.ts).
  const rezultati = await getMojiVodicRezultati(session.user.id);
  const poruke = bs.nalog.vodicLista;

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

      {rezultati.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-[#C7D6BA]/30 px-6 py-16 text-center">
          <p className="text-base text-[#1C2B22]/70">{poruke.prazno}</p>
          <Link
            href="/vodic"
            className="inline-flex items-center justify-center rounded-full bg-[#16332A] px-6 py-2.5 text-sm font-medium text-[#F2F5ED] transition-colors hover:bg-[#16332A]/90"
          >
            {poruke.pokreniVodic}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rezultati.map((rezultat) => (
            // Kartica namjerno nije klikabilna — prikaz punog historijskog
            // rezultata je zaseban zadatak za kasnije (vidi zahtjev).
            <div
              key={rezultat.id}
              className="flex flex-col gap-1.5 rounded-2xl border border-[#1C2B22]/10 bg-white p-5"
            >
              <span className="text-xs text-[#1C2B22]/60">
                {poruke.datum}: {formatDatum(rezultat.createdAt)}
              </span>
              <span className="text-sm font-medium text-[#1C2B22]">
                {rezultat.ciljevi.length > 0 ? rezultat.ciljevi.join(', ') : '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
