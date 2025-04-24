import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import UAParser from 'ua-parser-js';

const EXCLUDED_PATHS = [
  '/_next',
  '/api',
  '/static',
  '/favicon.ico',
  '/manifest.json',
];

// Add security headers
function addSecurityHeaders(response: NextResponse) {
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com; connect-src 'self' https://api.stripe.com https://m.stripe.network https://fonts.googleapis.com https://fonts.gstatic.com https://*.uploadthing.com https://*.utfs.io https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://*.stripe.com https://*.stripe.network https://stripe-camo.global.ssl.fastly.net https://*.uploadthing.com https://*.utfs.io https://*.ufs.sh https://www.googletagmanager.com https://www.google-analytics.com https://images.unsplash.com https://*.vercel.app https://*.supabase.co; frame-src 'self' https://js.stripe.com https://hooks.stripe.com; worker-src 'self' blob:;"
  );
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  return response;
}

function trackPageView(request: NextRequest): string {
  const sessionId = request.cookies.get('session_id')?.value || nanoid();
  return sessionId;
}

export async function middleware(request: NextRequest) {
  try {
    // Skip tracking for excluded paths
    if (EXCLUDED_PATHS.some(path => request.nextUrl.pathname.startsWith(path))) {
      return NextResponse.next();
    }

    const response = NextResponse.next();
    const sessionId = trackPageView(request);

    // Set session cookie
    response.cookies.set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Add security headers
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('[MIDDLEWARE_ERROR]', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}; 