// middleware.ts (à la racine)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // ✅ Ne pas bloquer les routes API
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // ... votre logique middleware
  return NextResponse.next();
}

export const config = {
  // ✅ Exclure les routes API du middleware si nécessaire
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};