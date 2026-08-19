import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@/auth';
import { getNotifications } from '@/lib/domain/notifications';
import { bs } from '@/lib/i18n/bs';
import { MarkNotificationsReadOnView } from '../../_components/MarkNotificationsReadOnView';

export const metadata: Metadata = {
  title: bs.nalog.obavjestenja.naslov,
};

function formatDatumVrijeme(datum: Date): string {
  const datumString = datum.toLocaleDateString('bs-BA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const vrijemeString = datum.toLocaleTimeString('bs-BA', { hour: '2-digit', minute: '2-digit' });
  return `${datumString} u ${vrijemeString}`;
}

export default async function MojaObavjestenjaPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/prijava?callbackUrl=/nalog/obavjestenja');
  }

  // session.user.id je iz auth() sesije, nikad sa klijenta.
  const obavjestenja = await getNotifications(session.user.id);

  const poruke = bs.nalog.obavjestenja;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      {/*
        Označavanje pročitanim se NE dešava ovdje tokom render-a (Server
        Action/revalidatePath to ne dozvoljava usred renderovanja rute) —
        MarkNotificationsReadOnView to pokreće sa klijenta nakon mount-a,
        strogo nakon što je gornja lista već poslana korisniku kao
        "nepročitano" (isti efekat kao stari redoslijed: dohvat prije
        označavanja, da se obavještenje vizuelno istakne kao novo).
      */}
      <MarkNotificationsReadOnView />

      <Link
        href="/nalog"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[#1C2B22]/70 hover:text-[#1C2B22]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {poruke.nazad}
      </Link>

      <h1 className="text-2xl font-semibold text-[#1C2B22] sm:text-3xl">{poruke.naslov}</h1>

      {obavjestenja.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-[#C7D6BA]/30 px-6 py-16 text-center">
          <p className="text-base text-[#1C2B22]/70">{poruke.prazno}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {obavjestenja.map((obavjestenje) => {
            const kartica = (
              <div
                className={`flex flex-col gap-1 rounded-2xl border p-5 transition-shadow hover:shadow-md ${
                  obavjestenje.procitano
                    ? 'border-[#1C2B22]/10 bg-white'
                    : 'border-[#16332A]/20 bg-[#C7D6BA]/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`text-sm text-[#1C2B22] ${
                      obavjestenje.procitano ? 'font-medium' : 'font-semibold'
                    }`}
                  >
                    {obavjestenje.naslov}
                  </span>
                  <span className="shrink-0 text-xs text-[#1C2B22]/50">
                    {formatDatumVrijeme(obavjestenje.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-[#1C2B22]/70">{obavjestenje.sadrzaj}</p>
              </div>
            );

            return obavjestenje.link ? (
              <Link key={obavjestenje.id} href={obavjestenje.link}>
                {kartica}
              </Link>
            ) : (
              <div key={obavjestenje.id}>{kartica}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
