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

// Payment redirect paths that need special handling
const PAYMENT_REDIRECT_PATHS = [
  '/shop/confirmation',
  '/shop/success',
  '/shop/failed',
  '/shop/checkout',
];

// Add security headers
function addSecurityHeaders(response: NextResponse) {
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.razorpay.com https://www.googletagmanager.com https://www.google-analytics.com; script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.razorpay.com https://www.googletagmanager.com https://www.google-analytics.com; connect-src 'self' https://api.stripe.com https://api.razorpay.com https://lumberjack.razorpay.com https://m.stripe.network https://fonts.googleapis.com https://fonts.gstatic.com https://*.uploadthing.com https://*.utfs.io https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://*.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://*.stripe.com https://*.stripe.network https://stripe-camo.global.ssl.fastly.net https://*.uploadthing.com https://*.utfs.io https://*.ufs.sh https://www.googletagmanager.com https://www.google-analytics.com https://images.unsplash.com https://binwahab.com https://*.supabase.co; frame-src 'self' https://js.stripe.com https://checkout.razorpay.com https://api.razorpay.com https://hooks.stripe.com https://*.razorpay.com; worker-src 'self' blob:;"
  );
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // For Cross-Origin issues, use a more permissive Opener Policy
  response.headers.set('Cross-Origin-Opener-Policy', 'unsafe-none');
  // For Cross-Origin issues, use a more permissive Embedder Policy
  response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  return response;
}

// Add CORS headers for payment-related paths
function addCORSHeaders(response: NextResponse) {
  // Set CORS headers for payment redirects
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-csrf-token, x-requested-with, accept, accept-version, content-length, content-md5, date, x-api-version, next-action');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

function trackPageView(request: NextRequest): string {
  const sessionId = request.cookies.get('session_id')?.value || nanoid();
  return sessionId;
}

export async function middleware(request: NextRequest) {
  try {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 204 });
      return addCORSHeaders(response);
    }

    // Check if this is a payment redirect path
    const isPaymentRedirect = PAYMENT_REDIRECT_PATHS.some(path => 
      request.nextUrl.pathname.startsWith(path)
    );

    // Skip tracking for excluded paths
    if (EXCLUDED_PATHS.some(path => request.nextUrl.pathname.startsWith(path)) && !isPaymentRedirect) {
      return NextResponse.next();
    }

    const response = NextResponse.next();
    const sessionId = trackPageView(request);

    // Set session cookie
    response.cookies.set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: isPaymentRedirect ? 'none' : 'lax', // Use 'none' for payment redirects
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Special handling for payment redirect paths - add CORS headers 
    if (isPaymentRedirect) {
      addCORSHeaders(response);
      
      // For payment paths, we use a more permissive security policy
      response.headers.set('Cross-Origin-Opener-Policy', 'unsafe-none');
      response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none');
      
      // Payment pages often have redirects, so let's not be too strict
      response.headers.set('Referrer-Policy', 'no-referrer-when-downgrade');
      
      return response;
    }

    // Add security headers for regular paths
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('[MIDDLEWARE_ERROR]', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}; 