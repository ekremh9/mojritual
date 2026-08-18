import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getUnreadCount } from '@/lib/domain/notifications';
import { bs } from '@/lib/i18n/bs';
import { KorisnickiMeni } from '@/app/(shop)/_components/KorisnickiMeni';
import { AdminNav } from './_components/AdminNav';

export const metadata: Metadata = {
  title: bs.admin.logo,
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  // Proxy već čuva /admin/*, ali granica pristupa ne smije zavisiti samo
  // od njega — layout je posljednji sloj prije podataka.
  if (!session?.user) {
    redirect(`/prijava?callbackUrl=${encodeURIComponent('/admin')}`);
  }

  if (session.user.role !== 'admin') {
    redirect('/');
  }

  // Admin obavještenja nisu u obimu za sada (nikad se ne kreiraju za admin
  // ulogu) — i dalje dohvatamo stvarni broj umjesto da tvrdimo 0, radi
  // ispravnosti u rijetkom slučaju da je nalog ranije bio brand/customer.
  const brojNeprocitanih = await getUnreadCount(session.user.id);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#F2F5ED]">
      <header className="border-b border-[#1C2B22]/10 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/admin" className="shrink-0 text-lg font-semibold text-[#16332A]">
            {bs.admin.logo}
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/"
              className="hidden rounded-full border border-[#1C2B22]/20 px-4 py-2 text-sm font-medium text-[#1C2B22] transition-colors hover:bg-[#F2F5ED] sm:inline-flex"
            >
              {bs.admin.nazadNaSajt}
            </Link>
            <KorisnickiMeni user={session.user} unreadCount={brojNeprocitanih} />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:flex-row sm:gap-10 sm:px-6 sm:py-8">
        <aside className="sm:w-52 sm:shrink-0">
          <AdminNav />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
