import { cache } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getPublishedPostBySlug } from '@/lib/domain/blog';
import { bs } from '@/lib/i18n/bs';

type BlogClanakPageProps = {
  params: Promise<{ slug: string }>;
};

const getClanak = cache(async (slug: string) => getPublishedPostBySlug(slug));

function formatDatum(datum: Date | null): string | null {
  return datum ? datum.toLocaleDateString('bs-BA', { year: 'numeric', month: 'long', day: 'numeric' }) : null;
}

export async function generateMetadata({ params }: BlogClanakPageProps): Promise<Metadata> {
  const { slug } = await params;
  const clanak = await getClanak(slug);

  if (!clanak) {
    return {};
  }

  return {
    title: clanak.naslov,
    description: clanak.sazetak ?? undefined,
  };
}

export default async function BlogClanakPage({ params }: BlogClanakPageProps) {
  const { slug } = await params;
  const clanak = await getClanak(slug);

  if (!clanak) {
    notFound();
  }

  const datum = formatDatum(clanak.objavljenoAt);
  // Sadržaj je običan tekst (bez markdown/HTML podrške u ovoj fazi) —
  // isti obrazac kao products.opis/brands.prica: prazan red razdvaja
  // pasuse (vidi bs.admin.blog.forma.polja.sadrzajPomoc).
  const pasusi = clanak.sadrzaj.split('\n\n').filter((pasus) => pasus.trim().length > 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/blog"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[#1C2B22]/70 hover:text-[#1C2B22]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {bs.blog.nazad}
      </Link>

      <div className="mt-4 flex flex-col gap-3">
        <h1 className="text-2xl font-semibold text-[#1C2B22] sm:text-3xl">{clanak.naslov}</h1>

        <div className="flex flex-wrap items-center gap-2 text-sm text-[#8A9086]">
          {datum ? <span>{datum}</span> : null}
          {datum && clanak.autorPrikaz ? <span aria-hidden="true">·</span> : null}
          {clanak.autorPrikaz ? <span>{bs.blog.autorPrefiks(clanak.autorPrikaz)}</span> : null}
        </div>
      </div>

      {clanak.coverUrl ? (
        <div className="relative mt-6 aspect-video w-full overflow-hidden rounded-2xl bg-[#F2F5ED]">
          <Image
            src={clanak.coverUrl}
            alt={clanak.naslov}
            fill
            sizes="(min-width: 768px) 48rem, 100vw"
            className="object-cover"
            priority
          />
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-4 text-base leading-relaxed text-[#1C2B22]/85">
        {pasusi.map((pasus, indeks) => (
          <p key={indeks}>{pasus}</p>
        ))}
      </div>
    </div>
  );
}
