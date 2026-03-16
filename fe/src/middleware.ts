import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register'];
const TOKEN_COOKIE = 'taskpulse_token';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isPublicPath = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const token = request.cookies.get(TOKEN_COOKIE)?.value;

  if (!token && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    const next = `${pathname}${search}`;
    loginUrl.searchParams.set('next', next);
    return NextResponse.redirect(loginUrl);
  }

  if (token && isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
