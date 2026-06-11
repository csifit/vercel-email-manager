import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          // ✅ FIX: Just add to existing response, don't create new one
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          // ✅ FIX: Just add to existing response, don't create new one
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // ✅ FIX: Clear, readable logic
  const pathname = request.nextUrl.pathname;

  const isPublicPage =
    pathname.startsWith('/login') ||
    pathname.startsWith('/pricing') ||
    pathname === '/'; // ✅ FIX: Allow homepage for guests

  const isApiRoute = pathname.startsWith('/api/');

  // ✅ FIX: Simple, clear condition
  if (!user && !isPublicPage && !isApiRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname); // ✅ FIX: Remember where they came from
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|otf)$).*)',
    '!(^/api)', // ✅ FIX: Explicitly exclude API routes
  ],
};