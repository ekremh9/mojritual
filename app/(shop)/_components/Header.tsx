import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { auth } from '@/auth';
import { bs } from '@/lib/i18n/bs';
import { KorisnickiMeni } from './KorisnickiMeni';
import { KorpaBroj } from './KorpaBroj';

export async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 border-b border-[#1C2B22]/10 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold text-[#16332A]">
          {bs.header.logo}
        </Link>

        <nav className="hidden items-center gap-8 sm:flex">
          <Link
            href="/shop"
            className="text-sm font-medium text-[#1C2B22] transition-colors hover:text-[#16332A]"
          >
            {bs.header.shop}
          </Link>
          <Link
            href="/kategorije"
            className="text-sm font-medium text-[#1C2B22] transition-colors hover:text-[#16332A]"
          >
            {bs.header.kategorije}
          </Link>
          <Link
            href="/vodic"
            className="text-sm font-medium text-[#1C2B22] transition-colors hover:text-[#16332A]"
          >
            {bs.header.ritualVodic}
          </Link>
          <Link
            href="/blog"
            className="text-sm font-medium text-[#1C2B22] transition-colors hover:text-[#16332A]"
          >
            {bs.header.blog}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/korpa"
            className="relative hidden items-center justify-center rounded-full p-2 text-[#1C2B22] transition-colors hover:bg-[#F2F5ED] sm:flex"
            aria-label={bs.header.korpa}
          >
            <ShoppingBag className="h-5 w-5" />
            <KorpaBroj />
          </Link>

          {session?.user ? (
            <KorisnickiMeni user={session.user} />
          ) : (
            <Link
              href="/prijava"
              className="inline-flex items-center justify-center rounded-full border border-[#1C2B22]/20 px-4 py-2 text-sm font-medium text-[#1C2B22] transition-colors hover:bg-[#F2F5ED] sm:px-5"
            >
              {bs.header.prijava}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
