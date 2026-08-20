import type { Metadata } from 'next';
import { getPublishedPosts } from '@/lib/domain/blog';
import { bs } from '@/lib/i18n/bs';
import { BlogKartica } from '../_components/BlogKartica';

export const metadata: Metadata = {
  title: bs.blog.naslov,
  description: bs.blog.metaOpis,
};

export default async function BlogPage() {
  const clanci = await getPublishedPosts();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-[#1C2B22] sm:text-3xl">{bs.blog.naslov}</h1>
        <p className="text-sm text-[#1C2B22]/60">{bs.blog.podnaslov}</p>
      </div>

      {clanci.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl bg-[#C7D6BA]/30 px-6 py-16 text-center">
          <p className="max-w-md text-base text-[#1C2B22]/70">{bs.blog.prazno}</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {clanci.map((clanak) => (
            <BlogKartica key={clanak.id} clanak={clanak} />
          ))}
        </div>
      )}
    </div>
  );
}
