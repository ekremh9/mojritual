import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@/auth';
import { MarkNotificationsReadOnView } from '@/app/(shop)/_components/MarkNotificationsReadOnView';
import { getUserBrand } from '@/lib/domain/brand-access';
import { getNotifications } from '@/lib/domain/notifications';
import { bs } from '@/lib/i18n/bs';

export const metadata: Metadata = {
  title: bs.portal.obavjestenja.naslov,
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

export default async function PortalObavjestenjaPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const pristup = await getUserBrand(session.user.id);

  if (!pristup) {
    // Layout već prikazuje poruku o nepovezanom nalogu.
    return null;
  }

  // session.user.id je iz auth() sesije, nikad sa klijenta.
  const obavjestenja = await getNotifications(session.user.id);

  const poruke = bs.portal.obavjestenja;

  return (
    <div className="flex flex-col gap-6">
      {/* Označavanje pročitanim se dešava na klijentu nakon mount-a — vidi komentar u MarkNotificationsReadOnView. */}
      <MarkNotificationsReadOnView />

      <Link
        href="/portal"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[#1C2B22]/70 hover:text-[#1C2B22]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {poruke.nazad}
      </Link>

      <h1 className="text-2xl font-semibold text-[#1C2B22]">{poruke.naslov}</h1>

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
