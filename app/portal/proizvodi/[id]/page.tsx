import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { getFeaturingPlans } from '@/lib/domain/admin-featuring';
import { getUserBrand } from '@/lib/domain/brand-access';
import { getFullCategoryTree } from '@/lib/domain/categories';
import { getGoalsForVodic } from '@/lib/domain/guide-data';
import { getPortalProductForEdit } from '@/lib/domain/portal-products';
import { bs } from '@/lib/i18n/bs';
import { ProductImageUpload } from '../_components/ProductImageUpload';
import { ProizvodAkcije } from '../_components/ProizvodAkcije';
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
  const [proizvod, kategorije, ciljevi, sviPlanovi] = await Promise.all([
    getPortalProductForEdit(pristup.brand.id, id),
    getFullCategoryTree(),
    getGoalsForVodic(),
    getFeaturingPlans('proizvod'),
  ]);

  if (!proizvod) {
    notFound();
  }

  const planovi = sviPlanovi.filter((plan) => plan.aktivan);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold text-[#1C2B22]">{bs.portal.proizvodi.uredi.naslov}</h1>
        <ProizvodAkcije
          productId={proizvod.id}
          status={proizvod.status}
          onemoguceno={pristup.brand.status === 'suspendovan'}
          naBrisanje="nazadNaListu"
          sakrijUredi
        />
      </div>

      <section className="flex flex-col gap-4 rounded-2xl border border-[#1C2B22]/10 bg-white p-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-[#1C2B22]">{bs.portal.proizvodi.slike.naslov}</h2>
        </div>

        <ProductImageUpload
          productId={proizvod.id}
          slike={proizvod.slike}
          onemoguceno={pristup.brand.status === 'suspendovan'}
        />
      </section>

      <ProizvodForma
        brandId={pristup.brand.id}
        productId={proizvod.id}
        pocetneVrijednosti={proizvod.pocetneVrijednosti}
        kategorije={kategorije}
        ciljevi={ciljevi}
        planovi={planovi}
        onemoguceno={pristup.brand.status === 'suspendovan'}
        status={proizvod.status}
        razlogOdbijanja={proizvod.razlogOdbijanja}
        brandVerifikovan={pristup.brand.verifikovan}
      />
    </div>
  );
}
