import Image from 'next/image';
import Link from 'next/link';
import { bs } from '@/lib/i18n/bs';

const KLASE_LINKA = 'text-sm text-ritual-warm-white/70 transition-colors hover:text-ritual-warm-white';
const KLASE_NASLOVA_KOLONE = 'text-sm font-semibold text-ritual-warm-white';

export function Footer() {
  const poruke = bs.footer;

  return (
    <footer className="bg-ritual-deep-green pb-16 text-ritual-warm-white sm:pb-0">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="" width={250} height={244} className="h-9 w-auto" />
            <span className="font-bodoni text-lg font-semibold uppercase tracking-wide">
              {bs.header.logo}
            </span>
          </div>
          <p className="text-sm font-medium text-ritual-warm-white/90">{poruke.brend.slogan}</p>
          <p className="text-sm text-ritual-warm-white/70">{poruke.brend.opis}</p>
        </div>

        <div className="flex flex-col gap-3">
          <span className={KLASE_NASLOVA_KOLONE}>{poruke.kupcima.naslov}</span>
          <Link href="/shop" className={KLASE_LINKA}>
            {poruke.kupcima.shop}
          </Link>
          <Link href="/vodic" className={KLASE_LINKA}>
            {poruke.kupcima.ritualVodic}
          </Link>
          <Link href="/partneri" className={KLASE_LINKA}>
            {poruke.kupcima.partneri}
          </Link>
          <Link href="/registracija" className={KLASE_LINKA}>
            {poruke.kupcima.kreirajteNalog}
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          <span className={KLASE_NASLOVA_KOLONE}>{poruke.brendovi.naslov}</span>
          <Link href="/registracija-brend" className={KLASE_LINKA}>
            {poruke.brendovi.registracija}
          </Link>
          <Link href="/registracija-brend" className={KLASE_LINKA}>
            {poruke.brendovi.veleprodaja}
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          <span className={KLASE_NASLOVA_KOLONE}>{poruke.kontakt.naslov}</span>
          <a href={`mailto:${poruke.kontakt.email}`} className={KLASE_LINKA}>
            {poruke.kontakt.email}
          </a>
        </div>
      </div>

      <div className="border-t border-ritual-warm-white/10 px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-6xl text-xs text-ritual-warm-white/60">{poruke.copyright}</div>
      </div>
    </footer>
  );
}
