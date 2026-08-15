import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getUserBrand } from '@/lib/domain/brand-access';
import { createDraftProductAction } from '@/lib/domain/portal-product-actions';
import { bs } from '@/lib/i18n/bs';

export const metadata: Metadata = {
  title: bs.portal.proizvodi.novi.naslov,
};

/**
 * Otvaranje ove stranice odmah kreira prazan nacrt (`createDraftProductAction`)
 * i redirektuje na `/portal/proizvodi/[id]` — od tog trenutka forma radi
 * identično kao uređivanje postojećeg proizvoda, uključujući upload slika,
 * koji zahtijeva `productId`.
 */
export default async function PortalNoviProizvodPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const pristup = await getUserBrand(session.user.id);

  if (!pristup) {
    // Layout već prikazuje poruku o nepovezanom nalogu.
    return null;
  }

  const rezultat = await createDraftProductAction(pristup.brand.id);

  if (!rezultat.ok) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-[#1C2B22]">{bs.portal.proizvodi.novi.naslov}</h1>
        <p role="alert" className="rounded-xl bg-[#B3261E]/10 px-4 py-3 text-sm text-[#B3261E]">
          {rezultat.error}
        </p>
        <Link href="/portal/proizvodi" className="text-sm font-medium text-[#16332A] hover:underline">
          {bs.portal.proizvodi.novi.nazad}
        </Link>
      </div>
    );
  }

  redirect(`/portal/proizvodi/${rezultat.productId}`);
}
