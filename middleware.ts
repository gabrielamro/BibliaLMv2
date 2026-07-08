import { NextResponse, type NextRequest } from 'next/server';

const REMOVED_ROUTES = new Set([
  '/fonte-conhecimento',
  '/trilhas',
  '/notes',
  '/artes-sacras',
  '/pulpito',
  '/pulpito/editor',
  '/social/ferramentas',
]);

export function middleware(request: NextRequest) {
  if (REMOVED_ROUTES.has(request.nextUrl.pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.next();
}
