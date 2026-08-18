import { Bell, LayoutDashboard, MessageCircle, Package, ShoppingBag, User } from 'lucide-react';
import { bs } from '@/lib/i18n/bs';
import { PortalNavLink } from './PortalNavLink';

const IKONA_KLASE = 'h-4 w-4 shrink-0';

type PortalNavProps = {
  unreadCount: number;
};

/**
 * Navigacija portala. Na mobitelu horizontalna traka koja se skroluje,
 * na `sm+` uspravni sidebar.
 */
export function PortalNav({ unreadCount }: PortalNavProps) {
  return (
    <nav
      aria-label={bs.portal.nav.naslov}
      className="flex gap-1 overflow-x-auto pb-1 sm:flex-col sm:gap-1 sm:overflow-x-visible sm:pb-0"
    >
      <PortalNavLink href="/portal" label={bs.portal.nav.pregled}>
        <LayoutDashboard className={IKONA_KLASE} />
      </PortalNavLink>
      <PortalNavLink href="/portal/obavjestenja" label={bs.portal.nav.obavjestenja(unreadCount)}>
        <Bell className={IKONA_KLASE} />
      </PortalNavLink>
      <PortalNavLink href="/portal/profil" label={bs.portal.nav.profil}>
        <User className={IKONA_KLASE} />
      </PortalNavLink>
      <PortalNavLink href="/portal/proizvodi" label={bs.portal.nav.proizvodi}>
        <Package className={IKONA_KLASE} />
      </PortalNavLink>
      <PortalNavLink href="/portal/narudzbe" label={bs.portal.nav.narudzbe}>
        <ShoppingBag className={IKONA_KLASE} />
      </PortalNavLink>
      <PortalNavLink href="/portal/reklamacije" label={bs.portal.nav.reklamacije}>
        <MessageCircle className={IKONA_KLASE} />
      </PortalNavLink>
    </nav>
  );
}
