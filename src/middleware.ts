import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response = NextResponse.next({ request: { headers: request.headers } });
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Redirect unauthenticated users away from protected routes
  if (!user && (path.startsWith('/dashboard') || path.startsWith('/leads') || path.startsWith('/settings') || path.startsWith('/businesses') || path.startsWith('/admin'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users away from auth pages
  if (user && (path === '/login' || path === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Check if user is a super admin
  const adminEmails = (process.env.SUPER_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin = user ? adminEmails.includes((user.email || '').toLowerCase()) : false;

  // Admin route protection: only super admins can access /admin/*
  if (user && path.startsWith('/admin') && !isAdmin) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Subscription gate: check if user has active subscription for dashboard routes
  // Super admins bypass this check
  if (user && !isAdmin && (path.startsWith('/dashboard') || path.startsWith('/leads') || path.startsWith('/businesses'))) {
    // Allow subscribe-success page through without subscription check
    if (path.startsWith('/subscribe-success')) {
      return response;
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .single();

    if (!subscription || subscription.status !== 'active') {
      if (!path.startsWith('/settings')) {
        return NextResponse.redirect(new URL('/settings?subscribe=true', request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/leads/:path*',
    '/settings/:path*',
    '/businesses/:path*',
    '/subscribe-success/:path*',
    '/admin/:path*',
    '/login',
    '/signup',
  ],
};
