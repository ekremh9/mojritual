import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { getUserBrand } from '@/lib/domain/brand-access';
import { getFullCategoryTree } from '@/lib/domain/categories';
import { getPortalProductForEdit } from '@/lib/domain/portal-products';
import { bs } from '@/lib/i18n/bs';
import { ProizvodForma } from '../_components/ProizvodForma';

export const metadata: Metadata = {
  title: bs.portal.proizvodi.uredi.naslov,
};

type PortalProizvodUrediPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PortalProizvodUrediPage({ params }: PortalProizvodUrediPageProps) {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const pristup = await getUserBrand(session.user.id);

  if (!pristup) {
    // Layout već prikazuje poruku o nepovezanom nalogu.
    return null;
  }

  const { id } = await params;

  // Provjera vlasništva je unutar getPortalProductForEdit — proizvod koji
  // ne postoji ili pripada drugom brendu tretiramo isto, kao notFound.
  const [proizvod, kategorije] = await Promise.all([
    getPortalProductForEdit(pristup.brand.id, id),
    getFullCategoryTree(),
  ]);

  if (!proizvod) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-[#1C2B22]">{bs.portal.proizvodi.uredi.naslov}</h1>
      </div>

      <ProizvodForma
        brandId={pristup.brand.id}
        productId={proizvod.id}
        pocetneVrijednosti={proizvod.pocetneVrijednosti}
        kategorije={kategorije}
        ponovnoOdobrenje={proizvod.status === 'odobren'}
        onemoguceno={pristup.brand.status === 'suspendovan'}
        status={proizvod.status}
        razlogOdbijanja={proizvod.razlogOdbijanja}
      />
    </div>
  );
}
