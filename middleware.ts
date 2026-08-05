import { NextResponse, type NextRequest } from 'next/server';

const REMOVED_ROUTES = new Set([
  '/fonte-conhecimento',
  '/notes',
  '/artes-sacras',
  '/pulpito',
  '/pulpito/editor',
  '/social/ferramentas',
]);

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/') {
    const newHomeUrl = request.nextUrl.clone();
    newHomeUrl.pathname = '/newhome';
    return NextResponse.redirect(newHomeUrl);
  }

  if (REMOVED_ROUTES.has(request.nextUrl.pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.next();
}
