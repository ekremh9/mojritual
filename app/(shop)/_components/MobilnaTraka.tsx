import { Home, LayoutGrid, ShoppingBag, Sparkles } from 'lucide-react';
import { bs } from '@/lib/i18n/bs';
import { KorpaBroj } from './KorpaBroj';
import { MobilnaTrakaStavka } from './MobilnaTrakaStavka';

const IKONA_KLASE = 'h-5 w-5';

/**
 * Donja navigacija, samo na mobitelu (`sm:hidden`) — zamjena za neaktivnu
 * hamburger ikonicu iz `Header`-a. Server komponenta; aktivna stavka se
 * ističe kroz `MobilnaTrakaStavka` (klijentski, zbog `usePathname`).
 */
export function MobilnaTraka() {
  const poruke = bs.header.mobilnaTraka;

  return (
    <nav
      aria-label={poruke.naslov}
      className="fixed inset-x-0 bottom-0 z-50 flex border-t border-[#1C2B22]/10 bg-white sm:hidden"
    >
      <MobilnaTrakaStavka href="/" label={poruke.pocetna}>
        <Home className={IKONA_KLASE} />
      </MobilnaTrakaStavka>
      <MobilnaTrakaStavka href="/shop" label={poruke.shop}>
        <LayoutGrid className={IKONA_KLASE} />
      </MobilnaTrakaStavka>
      <MobilnaTrakaStavka href="/vodic" label={poruke.vodic}>
        <Sparkles className={IKONA_KLASE} />
      </MobilnaTrakaStavka>
      <MobilnaTrakaStavka href="/korpa" label={poruke.korpa} badge={<KorpaBroj />}>
        <ShoppingBag className={IKONA_KLASE} />
      </MobilnaTrakaStavka>
    </nav>
  );
}
