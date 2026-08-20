import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getActiveMedicalReviewers } from '@/lib/domain/blog';
import { bs } from '@/lib/i18n/bs';
import { BlogForm } from '../_components/BlogForm';

export const metadata: Metadata = {
  title: bs.admin.blog.noviClanak,
};

export default async function AdminBlogNoviPage() {
  const recenzenti = await getActiveMedicalReviewers();
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

      <h1 className="text-2xl font-semibold text-[#1C2B22]">{poruke.noviClanak}</h1>

      <BlogForm
        postId={null}
        pocetneVrijednosti={{
          naslov: '',
          slug: '',
          sazetak: '',
          sadrzaj: '',
          autor: '',
          recenzentId: '',
          status: 'nacrt',
        }}
        recenzenti={recenzenti}
      />
    </div>
  );
}
