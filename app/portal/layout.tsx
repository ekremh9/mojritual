import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getUserBrand } from '@/lib/domain/brand-access';
import { bs } from '@/lib/i18n/bs';
import { BrandProvider } from './_components/BrandContext';
import { PortalHeader } from './_components/PortalHeader';
import { PortalNav } from './_components/PortalNav';

export const metadata: Metadata = {
  title: bs.portal.logo,
  robots: { index: false, follow: false },
};

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  // Proxy već čuva /portal/*, ali granica pristupa ne smije zavisiti samo
  // od njega — layout je posljednji sloj prije podataka brenda.
  if (!session?.user) {
    redirect(`/prijava?callbackUrl=${encodeURIComponent('/portal')}`);
  }

  if (session.user.role !== 'brand' && session.user.role !== 'admin') {
    redirect('/');
  }

  const pristup = await getUserBrand(session.user.id);

  if (!pristup) {
    return (
      <div className="flex min-h-full flex-1 flex-col bg-[#F2F5ED]">
        <PortalHeader user={session.user} />
        <div className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
          <div className="w-full max-w-md rounded-2xl border border-[#1C2B22]/10 bg-white p-8 text-center">
            <h1 className="text-lg font-semibold text-[#1C2B22]">
              {bs.portal.nepovezanNalog}
            </h1>
            <p className="mt-2 text-sm text-[#1C2B22]/70">{bs.portal.kontaktirajtePodrsku}</p>
          </div>
        </div>
      </div>
    );
  }

  const brand = {
    id: pristup.brand.id,
    naziv: pristup.brand.naziv,
    slug: pristup.brand.slug,
    status: pristup.brand.status,
  };

  return (
    <BrandProvider brand={brand}>
      <div className="flex min-h-full flex-1 flex-col bg-[#F2F5ED]">
        <PortalHeader user={session.user} brand={{ naziv: brand.naziv, status: brand.status }} />

        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:flex-row sm:gap-10 sm:px-6 sm:py-8">
          <aside className="sm:w-52 sm:shrink-0">
            <PortalNav />
          </aside>
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </BrandProvider>
  );
}
