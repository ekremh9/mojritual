import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getAdminPostById } from '@/lib/domain/admin-blog';
import { getActiveMedicalReviewers } from '@/lib/domain/blog';
import { bs } from '@/lib/i18n/bs';
import { BlogForm } from '../_components/BlogForm';
import { BlogImageUpload } from '../_components/BlogImageUpload';

type AdminBlogClanakPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: AdminBlogClanakPageProps): Promise<Metadata> {
  const { id } = await params;
  const clanak = await getAdminPostById(id);

  return { title: clanak?.naslov ?? bs.admin.blog.naslov };
}

export default async function AdminBlogClanakPage({ params }: AdminBlogClanakPageProps) {
  const { id } = await params;
  const [clanak, recenzenti] = await Promise.all([
    getAdminPostById(id),
    getActiveMedicalReviewers(),
  ]);

  if (!clanak) {
    notFound();
  }

  const poruke = bs.admin.blog;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/blog"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[#1C2B22]/70 hover:text-[#1C2B22]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {poruke.nazad}
      </Link>

      <h1 className="text-2xl font-semibold text-[#1C2B22]">{clanak.naslov}</h1>

      <section className="rounded-2xl border border-[#1C2B22]/10 bg-white p-5">
        <BlogImageUpload postId={clanak.id} trenutniUrl={clanak.coverUrl} />
      </section>

      <BlogForm
        postId={clanak.id}
        pocetneVrijednosti={{
          naslov: clanak.naslov,
          slug: clanak.slug,
          sazetak: clanak.sazetak ?? '',
          sadrzaj: clanak.sadrzaj,
          autor: clanak.autor ?? '',
          recenzentId: clanak.recenzentId ?? '',
          status: clanak.status,
        }}
        recenzenti={recenzenti}
      />
    </div>
  );
}
