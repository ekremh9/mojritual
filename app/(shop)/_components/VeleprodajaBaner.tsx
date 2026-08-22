import Link from 'next/link';
import { auth } from '@/auth';
import { jeOdobreniPartner } from '@/lib/domain/brand-access';
import { bs } from '@/lib/i18n/bs';

/**
 * Tanka informativna traka o veleprodaji — dvije varijante: odobren partner
 * (član `brand_users` čiji je `brands.status = 'odobren'`) vidi kratku
 * potvrdu bez CTA; gost (neprijavljen) vidi poziv da se registruje kao
 * partner. Svaki DRUGI ulogovan korisnik (admin, obični kupac, neodobren
 * partner) ne vidi ništa — CTA za veleprodaju za njih ostaje dostupan samo
 * kroz stalni link u Footer-u, ne kroz ovaj baner. Namjerno kompaktno, ne
 * veliki blok.
 */
export async function VeleprodajaBaner() {
  const session = await auth();
  const odobrenPartner = session?.user?.id ? await jeOdobreniPartner(session.user.id) : false;

  if (session?.user?.id && !odobrenPartner) {
    return null;
  }

  const poruke = bs.veleprodajaBaner;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 rounded-xl bg-ritual-green/40 px-4 py-3 text-center">
      <p className="text-sm text-ritual-charcoal">
        {odobrenPartner ? poruke.partnerTekst : poruke.gostTekst}
      </p>
      {!odobrenPartner ? (
        <Link
          href="/registracija-brend"
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-ritual-deep-green px-4 py-1.5 text-xs font-medium text-ritual-warm-white transition-colors hover:bg-ritual-deep-green/90"
        >
          {poruke.dugme}
        </Link>
      ) : null}
    </div>
  );
}
