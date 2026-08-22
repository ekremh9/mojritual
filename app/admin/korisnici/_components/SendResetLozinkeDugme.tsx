'use client';

import { useState } from 'react';
import { sendPasswordResetAsAdminAction } from '@/lib/domain/admin-users';
import { bs } from '@/lib/i18n/bs';

type SendResetLozinkeDugmeProps = {
  userId: string;
};

/** Admin prečica za slanje linka za reset lozinke — samo za customer/brand redove, vidi admin/korisnici/page.tsx gdje se admin redovi ne prikazuju uopšte. */
export function SendResetLozinkeDugme({ userId }: SendResetLozinkeDugmeProps) {
  const [saljeSe, setSaljeSe] = useState(false);
  const [poslano, setPoslano] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);

  const poruke = bs.admin.korisnici.resetLozinke;

  async function posalji() {
    setSaljeSe(true);
    setGreska(null);

    try {
      const rezultat = await sendPasswordResetAsAdminAction(userId);

      if (!rezultat.ok) {
        setGreska(rezultat.error);
        setSaljeSe(false);
        return;
      }

      setPoslano(true);
    } catch {
      setGreska(poruke.greskaOpsta);
      setSaljeSe(false);
    }
  }

  if (poslano) {
    return <span className="text-xs font-medium text-[#16332A]">{poruke.uspjeh}</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={posalji}
        disabled={saljeSe}
        className="inline-flex items-center justify-center rounded-full border border-[#1C2B22]/20 px-3 py-1.5 text-xs font-medium text-[#1C2B22] transition-colors hover:bg-[#F2F5ED] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saljeSe ? poruke.slanje : poruke.dugme}
      </button>
      {greska ? <span className="text-xs text-[#B3261E]">{greska}</span> : null}
    </div>
  );
}
