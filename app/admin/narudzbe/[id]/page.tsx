import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getOrderDetail } from '@/lib/domain/admin-orders';
import { formatCijena } from '@/lib/domain/format';
import type { Order, OrderShipment } from '@/lib/db/schema';
import { bs } from '@/lib/i18n/bs';

type AdminNarudzbaPageProps = {
  params: Promise<{ id: string }>;
};

const STATUS_KLASE: Record<Order['status'], string> = {
  na_cekanju: 'bg-amber-100 text-amber-800',
  potvrdjeno: 'bg-[#C7D6BA] text-[#1C2B22]',
  djelimicno_poslano: 'bg-[#C7D6BA] text-[#1C2B22]',
  poslano: 'bg-[#16332A]/10 text-[#16332A]',
  isporuceno: 'bg-[#16332A] text-[#F2F5ED]',
  otkazano: 'bg-[#B3261E]/10 text-[#B3261E]',
};

const POSILJKA_STATUS_KLASE: Record<OrderShipment['status'], string> = {
  novo: 'bg-amber-100 text-amber-800',
  potvrdjeno: 'bg-[#C7D6BA] text-[#1C2B22]',
  poslano: 'bg-[#16332A]/10 text-[#16332A]',
  isporuceno: 'bg-[#16332A] text-[#F2F5ED]',
  otkazano: 'bg-[#B3261E]/10 text-[#B3261E]',
  vraceno: 'bg-[#B3261E]/10 text-[#B3261E]',
};

function formatDatum(datum: Date): string {
  return datum.toLocaleDateString('bs-BA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export async function generateMetadata({ params }: AdminNarudzbaPageProps): Promise<Metadata> {
  const { id } = await params;
  const narudzba = await getOrderDetail(id);

  return { title: narudzba?.broj ?? bs.admin.narudzbe.naslov };
}

export default async function AdminNarudzbaPage({ params }: AdminNarudzbaPageProps) {
  const { id } = await params;
  const narudzba = await getOrderDetail(id);

  if (!narudzba) {
    notFound();
  }

  const poruke = bs.admin.narudzbe.detalj;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/narudzbe"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[#1C2B22]/70 hover:text-[#1C2B22]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {poruke.nazad}
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-[#1C2B22]">{narudzba.broj}</h1>
        <span
          className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_KLASE[narudzba.status]}`}
        >
          {bs.admin.narudzbe.status[narudzba.status]}
        </span>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex flex-col gap-6 lg:w-1/2">
          <section className="flex flex-col gap-2 rounded-2xl border border-[#1C2B22]/10 bg-white p-5">
            <h2 className="text-lg font-semibold text-[#1C2B22]">{poruke.podaciKupca}</h2>
            <div className="flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-[#1C2B22]/60">{poruke.polja.ime}</span>
                <span className="text-[#1C2B22]">{narudzba.kupacIme}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#1C2B22]/60">{poruke.polja.email}</span>
                <span className="text-[#1C2B22]">{narudzba.kupacEmail}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#1C2B22]/60">{poruke.polja.telefon}</span>
                <span className="text-[#1C2B22]">{narudzba.kupacTelefon}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#1C2B22]/60">{poruke.polja.adresa}</span>
                <span className="text-right text-[#1C2B22]">{narudzba.adresa}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#1C2B22]/60">{poruke.polja.grad}</span>
                <span className="text-[#1C2B22]">{narudzba.grad}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#1C2B22]/60">{poruke.polja.postanskiBroj}</span>
                <span className="text-[#1C2B22]">{narudzba.postanskiBroj}</span>
              </div>
              {narudzba.napomena ? (
                <div className="flex justify-between gap-4">
                  <span className="text-[#1C2B22]/60">{poruke.polja.napomena}</span>
                  <span className="text-right text-[#1C2B22]">{narudzba.napomena}</span>
                </div>
              ) : null}
            </div>
          </section>

          <section className="flex flex-col gap-2 rounded-2xl border border-[#1C2B22]/10 bg-white p-5">
            <div className="flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-[#1C2B22]/60">{poruke.polja.datum}</span>
                <span className="text-[#1C2B22]">{formatDatum(narudzba.createdAt)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#1C2B22]/60">{poruke.polja.nacinPlacanja}</span>
                <span className="text-[#1C2B22]">{poruke.pouzece}</span>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-3 rounded-2xl bg-[#16332A] p-6 text-[#F2F5ED]">
            <div className="flex items-center justify-between text-sm">
              <span>{poruke.medjuzbir}</span>
              <span>{formatCijena(narudzba.iznosStavki)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>{poruke.dostavaUkupno}</span>
              <span>{formatCijena(narudzba.iznosDostave)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-[#F2F5ED]/20 pt-3 text-lg font-semibold">
              <span>{poruke.ukupno}</span>
              <span>{formatCijena(narudzba.ukupno)}</span>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-4 lg:w-1/2">
          <h2 className="text-lg font-semibold text-[#1C2B22]">{poruke.posiljke}</h2>

          {narudzba.posiljke.map((posiljka) => (
            <div
              key={posiljka.id}
              className="overflow-hidden rounded-2xl border border-[#1C2B22]/10 bg-white"
            >
              <div className="flex items-center justify-between gap-3 border-b border-[#1C2B22]/10 px-5 py-3">
                <Link
                  href={`/partner/${posiljka.brend.slug}`}
                  className="text-sm font-semibold text-[#1C2B22] underline underline-offset-2"
                >
                  {poruke.posiljkaOd(posiljka.brend.naziv)}
                </Link>
                <span
                  className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${POSILJKA_STATUS_KLASE[posiljka.status]}`}
                >
                  {bs.admin.narudzbe.posiljkaStatus[posiljka.status]}
                </span>
              </div>

              <div className="flex flex-col divide-y divide-[#1C2B22]/10">
                {posiljka.stavke.map((stavka, indeks) => (
                  <div
                    key={indeks}
                    className="flex items-center justify-between gap-4 px-5 py-3 text-sm"
                  >
                    <span className="text-[#1C2B22]">
                      {stavka.nazivSnapshot} × {stavka.kolicina}
                    </span>
                    <span className="font-medium text-[#1C2B22]">
                      {formatCijena(stavka.cijenaSnapshot * stavka.kolicina)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-1 border-t border-[#1C2B22]/10 bg-[#F2F5ED]/60 px-5 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#1C2B22]/70">{poruke.dostava}</span>
                  <span className="font-medium text-[#1C2B22]">
                    {posiljka.besplatnaDostava ? poruke.besplatnaDostava : formatCijena(posiljka.cijenaDostave)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#1C2B22]/70">{poruke.kurir}</span>
                  <span className="text-[#1C2B22]">{posiljka.kurir ?? poruke.nemaPodatka}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#1C2B22]/70">{poruke.brojPosiljke}</span>
                  <span className="text-[#1C2B22]">{posiljka.brojPosiljke ?? poruke.nemaPodatka}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
