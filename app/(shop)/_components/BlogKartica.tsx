import Image from 'next/image';
import Link from 'next/link';
import { Newspaper } from 'lucide-react';
import type { BlogPostKartica } from '@/lib/domain/blog';
import { bs } from '@/lib/i18n/bs';

type BlogKarticaProps = {
  clanak: BlogPostKartica;
};

function formatDatum(datum: Date | null): string | null {
  return datum ? datum.toLocaleDateString('bs-BA', { year: 'numeric', month: 'long', day: 'numeric' }) : null;
}

export function BlogKartica({ clanak }: BlogKarticaProps) {
  const datum = formatDatum(clanak.objavljenoAt);

  return (
    <Link
      href={`/blog/${clanak.slug}`}
      className="flex flex-col overflow-hidden rounded-2xl border border-[#1C2B22]/10 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-video w-full shrink-0 bg-[#F2F5ED]">
        {clanak.coverUrl ? (
          <Image
            src={clanak.coverUrl}
            alt={clanak.naslov}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Newspaper className="h-8 w-8 text-[#8A9086]" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h2 className="text-lg font-semibold text-[#1C2B22]">{clanak.naslov}</h2>

        {clanak.sazetak ? (
          <p className="line-clamp-3 text-sm text-[#1C2B22]/70">{clanak.sazetak}</p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2 text-xs text-[#8A9086]">
          {datum ? <span>{datum}</span> : null}
          {datum && clanak.autorPrikaz ? <span aria-hidden="true">·</span> : null}
          {clanak.autorPrikaz ? <span>{bs.blog.autorPrefiks(clanak.autorPrikaz)}</span> : null}
        </div>
      </div>
    </Link>
  );
}
