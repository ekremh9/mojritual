'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteBlogPostAction } from '@/lib/domain/blog-actions';
import { bs } from '@/lib/i18n/bs';

type ObrisiClanakDugmeProps = {
  postId: string;
};

export function ObrisiClanakDugme({ postId }: ObrisiClanakDugmeProps) {
  const router = useRouter();
  const [ucitavanje, setUcitavanje] = useState(false);
  const poruke = bs.admin.blog;

  async function obrisi() {
    if (!window.confirm(poruke.obrisiPotvrda)) {
      return;
    }

    setUcitavanje(true);
    try {
      const rezultat = await deleteBlogPostAction(postId);

      if (!rezultat.ok) {
        window.alert(rezultat.error);
        return;
      }

      router.refresh();
    } catch {
      window.alert(bs.admin.greskaOpsta);
    } finally {
      setUcitavanje(false);
    }
  }

  return (
    <button
      type="button"
      onClick={obrisi}
      disabled={ucitavanje}
      className="inline-flex items-center justify-center rounded-full border border-[#B3261E]/40 px-3 py-1 text-xs font-medium text-[#B3261E] transition-colors hover:bg-[#B3261E]/10 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {ucitavanje ? poruke.brisanjeUToku : poruke.obrisi}
    </button>
  );
}
