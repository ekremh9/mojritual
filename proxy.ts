import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

const ADMIN_PREFIX = '/admin';
const PORTAL_PREFIX = '/portal';
const NALOG_PREFIX = '/nalog';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const jeHttps = request.nextUrl.protocol === 'https:';

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: jeHttps,
  });

  if (!token) {
    const prijavaUrl = new URL('/prijava', request.url);
    prijavaUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(prijavaUrl);
  }

  const role = token.role;

  if (pathname.startsWith(ADMIN_PREFIX) && role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname.startsWith(PORTAL_PREFIX) && role !== 'brand' && role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/portal/:path*', '/nalog/:path*'],
};
