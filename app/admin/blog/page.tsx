import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getAdminPosts } from '@/lib/domain/admin-blog';
import type { Post } from '@/lib/db/schema';
import { bs } from '@/lib/i18n/bs';
import { ObrisiClanakDugme } from './_components/ObrisiClanakDugme';

export const metadata: Metadata = {
  title: bs.admin.blog.naslov,
};

const STATUS_KLASE: Record<Post['status'], string> = {
  nacrt: 'bg-[#8A9086]/15 text-[#1C2B22]/70',
  objavljeno: 'bg-[#16332A] text-[#F2F5ED]',
};

function formatDatum(datum: Date | null): string {
  return datum ? datum.toLocaleDateString('bs-BA') : '—';
}

export default async function AdminBlogPage() {
  const clanci = await getAdminPosts();
  const poruke = bs.admin.blog;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-[#1C2B22]">{poruke.naslov}</h1>
        <Link
          href="/admin/blog/novi"
          className="inline-flex items-center justify-center rounded-full bg-[#16332A] px-5 py-2.5 text-sm font-medium text-[#F2F5ED] transition-colors hover:bg-[#16332A]/90"
        >
          {poruke.noviClanak}
        </Link>
      </div>

      {clanci.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-[#C7D6BA]/30 px-6 py-16 text-center">
          <p className="text-base text-[#1C2B22]/70">{poruke.prazno}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#1C2B22]/10 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#1C2B22]/10 text-xs font-medium uppercase tracking-wide text-[#8A9086]">
                <th className="px-4 py-3">{poruke.tabela.slika}</th>
                <th className="px-4 py-3">{poruke.tabela.naslov}</th>
                <th className="px-4 py-3">{poruke.tabela.status}</th>
                <th className="px-4 py-3">{poruke.tabela.objavljeno}</th>
                <th className="px-4 py-3">{poruke.tabela.akcije}</th>
              </tr>
            </thead>
            <tbody>
              {clanci.map((clanak) => (
                <tr key={clanak.id} className="border-b border-[#1C2B22]/10 last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/blog/${clanak.id}`}>
                      <div className="relative h-10 w-14 overflow-hidden rounded-lg border border-[#1C2B22]/10 bg-[#F2F5ED]">
                        {clanak.coverUrl ? (
                          <Image
                            src={clanak.coverUrl}
                            alt={clanak.naslov}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/blog/${clanak.id}`}
                      className="font-medium text-[#1C2B22] hover:underline"
                    >
                      {clanak.naslov}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_KLASE[clanak.status]}`}
                    >
                      {bs.admin.blog.status[clanak.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#1C2B22]/70">{formatDatum(clanak.objavljenoAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/blog/${clanak.id}`}
                        className="inline-flex items-center justify-center rounded-full border border-[#1C2B22]/20 px-3 py-1 text-xs font-medium text-[#1C2B22] transition-colors hover:bg-[#F2F5ED]"
                      >
                        {poruke.uredi}
                      </Link>
                      <ObrisiClanakDugme postId={clanak.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
