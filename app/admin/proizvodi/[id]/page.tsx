import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getProductForAdmin } from '@/lib/domain/admin-products';
import { formatCijena } from '@/lib/domain/format';
import type { Product } from '@/lib/db/schema';
import { bs } from '@/lib/i18n/bs';
import { IsticanjeProizvoda } from '../_components/IsticanjeProizvoda';
import { ProizvodOdobrenje } from '../_components/ProizvodOdobrenje';
import { VratiNaPopravku } from '../_components/VratiNaPopravku';

type AdminProizvodPageProps = {
  params: Promise<{ id: string }>;
};

const STATUS_KLASE: Record<Product['status'], string> = {
  nacrt: 'bg-[#8A9086]/15 text-[#1C2B22]/70',
  na_cekanju: 'bg-amber-100 text-amber-800',
  odobren: 'bg-[#16332A] text-[#F2F5ED]',
  odbijen: 'bg-[#B3261E]/10 text-[#B3261E]',
};

function formatDatum(datum: Date): string {
  return datum.toLocaleDateString('bs-BA');
}

export async function generateMetadata({ params }: AdminProizvodPageProps): Promise<Metadata> {
  const { id } = await params;
  const proizvod = await getProductForAdmin(id);

  return { title: proizvod?.naziv ?? bs.admin.proizvodi.naslov };
}

export default async function AdminProizvodPage({ params }: AdminProizvodPageProps) {
  const { id } = await params;
  const proizvod = await getProductForAdmin(id);

  if (!proizvod) {
    notFound();
  }

  const poruke = bs.admin.proizvodi.detalj;
  const pasusiOpisa =
    proizvod.opis?.split('\n\n').filter((pasus) => pasus.trim().length > 0) ?? [];
  const glavnaSlika = proizvod.slike[0] ?? null;
  const ostaleSlike = proizvod.slike.slice(1);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/proizvodi"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[#1C2B22]/70 hover:text-[#1C2B22]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {poruke.nazad}
      </Link>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="lg:w-1/2">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[#F2F5ED]">
            {glavnaSlika ? (
              <Image
                src={glavnaSlika.url}
                alt={glavnaSlika.alt ?? proizvod.naziv}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
                priority
              />
            ) : null}
          </div>
          {ostaleSlike.length > 0 ? (
            <div className="mt-3 flex gap-3">
              {ostaleSlike.map((slika) => (
                <div
                  key={slika.url}
                  className="relative aspect-square w-20 overflow-hidden rounded-xl bg-[#F2F5ED]"
                >
                  <Image
                    src={slika.url}
                    alt={slika.alt ?? proizvod.naziv}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-6 lg:w-1/2">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_KLASE[proizvod.status]}`}
              >
                {bs.admin.proizvodi.status[proizvod.status]}
              </span>
              {proizvod.kategorije.map((kategorija) => (
                <span
                  key={kategorija.slug}
                  className="rounded-full bg-[#C7D6BA] px-3 py-1 text-xs font-medium text-[#1C2B22]"
                >
                  {kategorija.naziv}
                </span>
              ))}
              {(proizvod.oznake ?? []).map((oznaka) =>
                oznaka in bs.admin.proizvodi.oznake ? (
                  <span
                    key={oznaka}
                    className="rounded-full bg-[#16332A]/10 px-3 py-1 text-xs font-medium text-[#16332A]"
                  >
                    {bs.admin.proizvodi.oznake[oznaka as keyof typeof bs.admin.proizvodi.oznake]}
                  </span>
                ) : null,
              )}
            </div>

            <h1 className="text-2xl font-semibold text-[#1C2B22] sm:text-3xl">{proizvod.naziv}</h1>

            {proizvod.kratkiOpis ? (
              <p className="text-base text-[#1C2B22]/70">{proizvod.kratkiOpis}</p>
            ) : null}
          </div>

          {proizvod.status === 'odbijen' && proizvod.razlogOdbijanja ? (
            <div className="flex flex-col gap-1 rounded-2xl bg-[#B3261E]/10 p-4">
              <span className="text-xs font-medium text-[#B3261E]">{poruke.razlogOdbijanja}</span>
              <p className="text-sm text-[#B3261E]">{proizvod.razlogOdbijanja}</p>
            </div>
          ) : null}

          <div className="flex flex-col gap-2 rounded-2xl border border-[#1C2B22]/10 bg-white p-4 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-[#1C2B22]/60">{poruke.polja.brend}</span>
              <Link
                href={`/partner/${proizvod.brend.slug}`}
                className="font-medium text-[#1C2B22] underline underline-offset-2"
              >
                {proizvod.brend.naziv}
              </Link>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#1C2B22]/60">{bs.admin.proizvodi.tabela.cijena}</span>
              <span className="font-medium text-[#1C2B22]">
                {formatCijena(proizvod.cijena)}
                {proizvod.staraCijena !== null ? (
                  <span className="ml-2 text-xs text-[#1C2B22]/50 line-through">
                    {formatCijena(proizvod.staraCijena)}
                  </span>
                ) : null}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#1C2B22]/60">{poruke.polja.forma}</span>
              <span className="text-[#1C2B22]">{bs.admin.proizvodi.forme[proizvod.forma]}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#1C2B22]/60">{poruke.polja.dostupnost}</span>
              <span className="text-[#1C2B22]">
                {bs.admin.proizvodi.dostupnostOpcije[proizvod.dostupnost]}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#1C2B22]/60">{poruke.polja.poslano}</span>
              <span className="text-[#1C2B22]">{formatDatum(proizvod.createdAt)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#1C2B22]/60">{poruke.polja.azurirano}</span>
              <span className="text-[#1C2B22]">{formatDatum(proizvod.updatedAt)}</span>
            </div>
          </div>

          {pasusiOpisa.length > 0 ? (
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-[#1C2B22]">{poruke.opis}</h2>
              <div className="flex flex-col gap-3 text-sm leading-relaxed text-[#1C2B22]/80">
                {pasusiOpisa.map((pasus, indeks) => (
                  <p key={indeks}>{pasus}</p>
                ))}
              </div>
            </div>
          ) : null}

          {proizvod.sastojci || proizvod.doziranje ? (
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold text-[#1C2B22]">{poruke.sastojciIDoziranje}</h2>
              {proizvod.sastojci ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-[#1C2B22]/80">
                  {proizvod.sastojci}
                </p>
              ) : null}
              {proizvod.doziranje ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-[#1C2B22]/80">
                  {proizvod.doziranje}
                </p>
              ) : null}
            </div>
          ) : null}

          {proizvod.upozorenja ? (
            <div className="flex flex-col gap-2 rounded-2xl bg-[#C7D6BA]/40 p-4">
              <h2 className="flex items-center gap-2 text-base font-semibold text-[#1C2B22]">
                <span aria-hidden="true">⚠️</span>
                {poruke.upozorenja}
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-[#1C2B22]/80">
                {proizvod.upozorenja}
              </p>
            </div>
          ) : null}

          {proizvod.status === 'na_cekanju' ? (
            <ProizvodOdobrenje productId={proizvod.id} />
          ) : proizvod.status === 'odobren' ? (
            <VratiNaPopravku productId={proizvod.id} />
          ) : (
            <p className="rounded-xl bg-[#C7D6BA]/40 px-4 py-3 text-sm text-[#1C2B22]/80">
              {poruke.vecObradjeno}
            </p>
          )}

          <IsticanjeProizvoda
            productId={proizvod.id}
            istaknutStatus={proizvod.istaknutStatus}
            istaknutRazlogOdbijanja={proizvod.istaknutRazlogOdbijanja}
            istaknutPlan={proizvod.istaknutPlan}
            odobren={proizvod.status === 'odobren'}
          />
        </div>
      </div>
    </div>
  );
}
