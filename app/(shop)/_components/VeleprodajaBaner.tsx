import Link from 'next/link';
import { auth } from '@/auth';
import { jeOdobreniPartner } from '@/lib/domain/brand-access';
import { bs } from '@/lib/i18n/bs';

/**
 * Tanka informativna traka o veleprodaji — dvije varijante:
 * odobren partner (član `brand_users` čiji je `brands.status = 'odobren'`)
 * vidi kratku potvrdu bez CTA; svako drugi (gost ili obični kupac) vidi
 * poziv da se registruje kao partner. Namjerno kompaktno, ne veliki blok.
 */
export async function VeleprodajaBaner() {
  const session = await auth();
  const odobrenPartner = session?.user?.id ? await jeOdobreniPartner(session.user.id) : false;

  const poruke = bs.veleprodajaBaner;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#C7D6BA]/40 px-4 py-3">
      <p className="text-sm text-[#1C2B22]">
        {odobrenPartner ? poruke.partnerTekst : poruke.gostTekst}
      </p>
      {!odobrenPartner ? (
        <Link
          href="/registracija-brend"
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#16332A] px-4 py-1.5 text-xs font-medium text-[#F2F5ED] transition-colors hover:bg-[#16332A]/90"
        >
          {poruke.dugme}
        </Link>
      ) : null}
    </div>
  );
}
