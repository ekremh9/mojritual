import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BadgeCheck } from 'lucide-react';
import { getBrandForAdmin } from '@/lib/domain/admin-brands';
import type { Brand } from '@/lib/db/schema';
import { bs } from '@/lib/i18n/bs';
import { BrendOdobrenje } from '../_components/BrendOdobrenje';
import { IsticanjePartnera } from '../_components/IsticanjePartnera';
import { VerifikacijaPartnera } from '../_components/VerifikacijaPartnera';

type AdminBrendPageProps = {
  params: Promise<{ id: string }>;
};

const STATUS_KLASE: Record<Brand['status'], string> = {
  na_cekanju: 'bg-amber-100 text-amber-800',
  odobren: 'bg-[#16332A] text-[#F2F5ED]',
  suspendovan: 'bg-[#8A9086]/30 text-[#1C2B22]',
};

function formatDatum(datum: Date): string {
  return datum.toLocaleDateString('bs-BA');
}

export async function generateMetadata({ params }: AdminBrendPageProps): Promise<Metadata> {
  const { id } = await params;
  const brend = await getBrandForAdmin(id);

  return { title: brend?.naziv ?? bs.admin.brendovi.naslov };
}

export default async function AdminBrendPage({ params }: AdminBrendPageProps) {
  const { id } = await params;
  const brend = await getBrandForAdmin(id);

  if (!brend) {
    notFound();
  }

  const poruke = bs.admin.brendovi.detalj;
  const pasusiPrice = brend.prica?.split('\n\n').filter((pasus) => pasus.trim().length > 0) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/brendovi"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[#1C2B22]/70 hover:text-[#1C2B22]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {poruke.nazad}
      </Link>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex flex-col gap-4 lg:w-1/3">
          {brend.logoUrl ? (
            <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-[#1C2B22]/10 bg-[#F2F5ED]">
              <Image src={brend.logoUrl} alt={brend.naziv} fill sizes="96px" className="object-cover" />
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_KLASE[brend.status]}`}
            >
              {bs.admin.brendovi.status[brend.status]}
            </span>
            {brend.verifikovan ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#C7D6BA]/50 px-2.5 py-1 text-xs font-medium text-[#1C2B22]">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                {bs.partner.verifikovan}
              </span>
            ) : null}
          </div>

          <h1 className="text-2xl font-semibold text-[#1C2B22]">{brend.naziv}</h1>
          {brend.kratkiOpis ? <p className="text-sm text-[#1C2B22]/70">{brend.kratkiOpis}</p> : null}

          <div className="flex flex-col gap-2 rounded-2xl border border-[#1C2B22]/10 bg-white p-4 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-[#1C2B22]/60">{poruke.registrovan}</span>
              <span className="text-[#1C2B22]">{formatDatum(brend.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:w-2/3">
          <section className="flex flex-col gap-2 rounded-2xl border border-[#1C2B22]/10 bg-white p-5">
            <h2 className="text-lg font-semibold text-[#1C2B22]">{poruke.kontakt}</h2>
            <div className="flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-[#1C2B22]/60">{poruke.polja.email}</span>
                <span className="text-[#1C2B22]">{brend.email ?? poruke.nemaPodatka}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#1C2B22]/60">{poruke.polja.telefon}</span>
                <span className="text-[#1C2B22]">{brend.telefon ?? poruke.nemaPodatka}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#1C2B22]/60">{poruke.polja.web}</span>
                <span className="text-[#1C2B22]">{brend.web ?? poruke.nemaPodatka}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#1C2B22]/60">{poruke.polja.adresa}</span>
                <span className="text-[#1C2B22]">{brend.adresa ?? poruke.nemaPodatka}</span>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-2 rounded-2xl border border-[#1C2B22]/10 bg-white p-5">
            <h2 className="text-lg font-semibold text-[#1C2B22]">{poruke.pravniPodaci}</h2>
            <div className="flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-[#1C2B22]/60">{poruke.polja.jib}</span>
                <span className="text-[#1C2B22]">{brend.jib ?? poruke.nemaPodatka}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#1C2B22]/60">{poruke.polja.pdvBroj}</span>
                <span className="text-[#1C2B22]">{brend.pdvBroj ?? poruke.nemaPodatka}</span>
              </div>
            </div>
          </section>

          {pasusiPrice.length > 0 ? (
            <section className="flex flex-col gap-3 rounded-2xl border border-[#1C2B22]/10 bg-white p-5">
              <h2 className="text-lg font-semibold text-[#1C2B22]">{poruke.prica}</h2>
              <div className="flex flex-col gap-3 text-sm leading-relaxed text-[#1C2B22]/80">
                {pasusiPrice.map((pasus, indeks) => (
                  <p key={indeks}>{pasus}</p>
                ))}
              </div>
            </section>
          ) : null}

          {brend.status === 'na_cekanju' ? (
            <BrendOdobrenje brandId={brend.id} />
          ) : (
            <p className="rounded-xl bg-[#C7D6BA]/40 px-4 py-3 text-sm text-[#1C2B22]/80">
              {bs.admin.brendovi.status[brend.status]}
            </p>
          )}

          <p className="text-xs text-[#8A9086]">{poruke.odbijanjeNedostupno}</p>

          <VerifikacijaPartnera
            brandId={brend.id}
            verifikovan={brend.verifikovan}
            odobren={brend.status === 'odobren'}
          />

          <IsticanjePartnera
            brandId={brend.id}
            istaknut={brend.istaknut}
            odobren={brend.status === 'odobren'}
          />
        </div>
      </div>
    </div>
  );
}
