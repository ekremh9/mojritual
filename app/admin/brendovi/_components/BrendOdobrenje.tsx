'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { approveBrandAction } from '@/lib/domain/admin-actions';
import { bs } from '@/lib/i18n/bs';

type BrendOdobrenjeProps = {
  brandId: string;
};

/**
 * Akcija odobravanja za brend na čekanju. Nema "Odbij" — `brands.status`
 * trenutno nema vrijednost za odbijen brend (vidi docs/schema.md sekcija 2
 * i napomenu u lib/domain/admin-actions.ts).
 */
export function BrendOdobrenje({ brandId }: BrendOdobrenjeProps) {
  const router = useRouter();
  const poruke = bs.admin.brendovi.detalj;

  const [greska, setGreska] = useState<string | null>(null);
  const [uspjeh, setUspjeh] = useState(false);
  const [ucitavanje, setUcitavanje] = useState(false);

  async function odobri() {
    setGreska(null);
    setUcitavanje(true);

    try {
      const rezultat = await approveBrandAction(brandId);

      if (!rezultat.ok) {
        setGreska(rezultat.error);
        return;
      }

      setUspjeh(true);
      router.refresh();
    } catch {
      setGreska(bs.admin.greskaOpsta);
    } finally {
      setUcitavanje(false);
    }
  }

  if (uspjeh) {
    return (
      <p
        role="status"
        className="rounded-xl bg-[#C7D6BA]/50 px-4 py-3 text-sm font-medium text-[#16332A]"
      >
        {poruke.uspjehOdobreno}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {greska ? (
        <p role="alert" className="rounded-xl bg-[#B3261E]/10 px-4 py-3 text-sm text-[#B3261E]">
          {greska}
        </p>
      ) : null}

      <button
        type="button"
        onClick={odobri}
        disabled={ucitavanje}
        className="inline-flex w-fit items-center justify-center rounded-full bg-[#16332A] px-6 py-2.5 text-sm font-medium text-[#F2F5ED] transition-colors hover:bg-[#16332A]/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {ucitavanje ? poruke.odobriUcitavanje : poruke.odobri}
      </button>
    </div>
  );
}
