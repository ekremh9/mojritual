import {
  Building2,
  Compass,
  LayoutDashboard,
  Newspaper,
  Package,
  Settings,
  ShoppingBag,
  Tag,
} from 'lucide-react';
import { bs } from '@/lib/i18n/bs';
import { AdminNavLink } from './AdminNavLink';

const IKONA_KLASE = 'h-4 w-4 shrink-0';

/**
 * Navigacija admin panela. Na mobitelu horizontalna traka koja se
 * skroluje, na `sm+` uspravni sidebar — isti pattern kao PortalNav.
 */
export function AdminNav() {
  return (
    <nav
      aria-label={bs.admin.nav.naslov}
      className="flex gap-1 overflow-x-auto pb-1 sm:flex-col sm:gap-1 sm:overflow-x-visible sm:pb-0"
    >
      <AdminNavLink href="/admin" label={bs.admin.nav.pregled}>
        <LayoutDashboard className={IKONA_KLASE} />
      </AdminNavLink>
      <AdminNavLink href="/admin/proizvodi" label={bs.admin.nav.proizvodi}>
        <Package className={IKONA_KLASE} />
      </AdminNavLink>
      <AdminNavLink href="/admin/brendovi" label={bs.admin.nav.brendovi}>
        <Building2 className={IKONA_KLASE} />
      </AdminNavLink>
      <AdminNavLink href="/admin/narudzbe" label={bs.admin.nav.narudzbe}>
        <ShoppingBag className={IKONA_KLASE} />
      </AdminNavLink>
      <AdminNavLink href="/admin/vodic" label={bs.admin.nav.vodic}>
        <Compass className={IKONA_KLASE} />
      </AdminNavLink>
      <AdminNavLink href="/admin/cjenovnik" label={bs.admin.nav.cjenovnik}>
        <Tag className={IKONA_KLASE} />
      </AdminNavLink>
      <AdminNavLink href="/admin/blog" label={bs.admin.nav.blog}>
        <Newspaper className={IKONA_KLASE} />
      </AdminNavLink>
      <AdminNavLink href="/admin/postavke" label={bs.admin.nav.postavke}>
        <Settings className={IKONA_KLASE} />
      </AdminNavLink>
    </nav>
  );
}
