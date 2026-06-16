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
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Get user once
  const { data: { user } } = await supabase.auth.getUser();

  // Protect routes: redirect to login if not authenticated
  const pathname = request.nextUrl.pathname;

  // Define which pages are public (don't require authentication)
  const isPublicPage =
    pathname.startsWith('/login') ||
    pathname.startsWith('/pricing') ||
    pathname === '/'; // Allow homepage for guests

  // API routes are protected separately (they handle auth themselves)
  const isApiRoute = pathname.startsWith('/api/');

  // If user is NOT logged in AND trying to access a protected page (not public/api)
  if (!user && !isPublicPage && !isApiRoute) {
    // Redirect to login, storing the original URL
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  // FIXED: Only one valid matcher pattern
  // Exclude: static files, images, favicon, fonts
  // This pattern works with Next.js 16+
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|otf)).*)',
  ],
};
