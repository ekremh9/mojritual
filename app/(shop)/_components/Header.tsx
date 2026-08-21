import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { auth } from '@/auth';
import { getUnreadCount } from '@/lib/domain/notifications';
import { bs } from '@/lib/i18n/bs';
import { KorisnickiMeni } from './KorisnickiMeni';
import { KorpaBroj } from './KorpaBroj';

export async function Header() {
  const session = await auth();
  // Header je već server component koji zna sesiju — broj nepročitanih se
  // dohvata ovdje i prosljeđuje kao prop, isti obrazac kao prosljeđivanje
  // `user`-a u KorisnickiMeni. Nema potrebe za dodatnim klijentskim pozivom.
  const brojNeprocitanih = session?.user?.id ? await getUnreadCount(session.user.id) : 0;

  return (
    <header className="sticky top-0 z-50 border-b border-ritual-charcoal/10 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image src="/logo.png" alt="" width={508} height={491} className="h-9 w-auto" priority />
          <span className="font-bodoni text-lg font-semibold uppercase tracking-wide text-ritual-deep-green">
            {bs.header.logo}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 sm:flex">
          <Link
            href="/shop"
            className="text-sm font-medium text-ritual-charcoal transition-colors hover:text-ritual-deep-green"
          >
            {bs.header.shop}
          </Link>
          <Link
            href="/vodic"
            className="text-sm font-medium text-ritual-charcoal transition-colors hover:text-ritual-deep-green"
          >
            {bs.header.ritualVodic}
          </Link>
          <Link
            href="/partneri"
            className="text-sm font-medium text-ritual-charcoal transition-colors hover:text-ritual-deep-green"
          >
            {bs.header.partneri}
          </Link>
          <Link
            href="/blog"
            className="text-sm font-medium text-ritual-charcoal transition-colors hover:text-ritual-deep-green"
          >
            {bs.header.blog}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/korpa"
            className="relative hidden items-center justify-center rounded-full p-2 text-ritual-charcoal transition-colors hover:bg-ritual-beige sm:flex"
            aria-label={bs.header.korpa}
          >
            <ShoppingBag className="h-5 w-5" />
            <KorpaBroj />
          </Link>

          {session?.user ? (
            <KorisnickiMeni user={session.user} unreadCount={brojNeprocitanih} />
          ) : (
            <Link
              href="/prijava"
              className="inline-flex items-center justify-center rounded-full border border-ritual-charcoal/20 px-4 py-2 text-sm font-medium text-ritual-charcoal transition-colors hover:bg-ritual-beige sm:px-5"
            >
              {bs.header.prijava}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
