import type { Metadata } from 'next';
import { auth } from '@/auth';
import { getUserBrand } from '@/lib/domain/brand-access';
import { getFullCategoryTree } from '@/lib/domain/categories';
import type { ProizvodUnos } from '@/lib/domain/product-form';
import { bs } from '@/lib/i18n/bs';
import { ProizvodForma } from '../_components/ProizvodForma';

export const metadata: Metadata = {
  title: bs.portal.proizvodi.novi.naslov,
};

const PRAZNE_VRIJEDNOSTI: ProizvodUnos = {
  naziv: '',
  kratkiOpis: '',
  opis: '',
  forma: '',
  kategorije: [],
  sastojci: '',
  doziranje: '',
  upozorenja: '',
  cijenaKm: '',
  staraCijenaKm: '',
  dostupnost: 'dostupno',
};

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

  const kategorije = await getFullCategoryTree();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-[#1C2B22]">{bs.portal.proizvodi.novi.naslov}</h1>
      </div>

      <div className="rounded-2xl border border-[#1C2B22]/10 bg-[#C7D6BA]/25 px-4 py-3">
        <p className="text-sm text-[#1C2B22]/80">{bs.portal.proizvodi.slike.napomenaNoviProizvod}</p>
      </div>

      <ProizvodForma
        brandId={pristup.brand.id}
        productId={null}
        pocetneVrijednosti={PRAZNE_VRIJEDNOSTI}
        kategorije={kategorije}
        ponovnoOdobrenje={false}
        onemoguceno={pristup.brand.status === 'suspendovan'}
        status={null}
      />
    </div>
  );
}
