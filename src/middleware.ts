import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from 'next/server';

// CSP headers for Stripe integration
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.stripe.com https://*.stripe.network https://m.stripe.network https://checkout.stripe.com;
  frame-src 'self' https://*.stripe.com https://*.stripe.network https://checkout.stripe.com;
  style-src 'self' 'unsafe-inline' https://*.stripe.com;
  img-src 'self' data: https://*.stripe.com https://*.stripe.network https://stripe-camo.global.ssl.fastly.net;
  connect-src 'self' https://*.stripe.com https://*.stripe.network https://checkout.stripe.com;
  worker-src 'self' blob: https://*.stripe.com https://*.stripe.network;
  child-src 'self' blob: https://*.stripe.com https://*.stripe.network;
  wasm-src 'self' 'unsafe-eval' blob: data:;
`.replace(/\s{2,}/g, ' ').trim();

// Middleware function that adds security headers
function addSecurityHeaders(response: NextResponse) {
  // Set CSP header
  response.headers.set('Content-Security-Policy', cspHeader);
  
  // Set CORS headers
  response.headers.set('Access-Control-Allow-Origin', 'https://checkout.stripe.com');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  // Other security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN'); // Changed from DENY to allow Stripe iframe
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  return response;
}

// Auth middleware for admin routes
export default withAuth(
  function middleware(request: NextRequest) {
    return addSecurityHeaders(NextResponse.next());
  },
  {
    callbacks: {
      authorized: ({ token }) => token?.role === "ADMIN",
    },
  }
);

// Separate middleware for non-admin routes that need security headers
export function middleware(request: NextRequest) {
  // Skip admin routes as they're handled by the auth middleware
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }
  
  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    '/admin/:path*',  // Protected admin routes
    '/api/:path*',    // API routes need security headers
    '/checkout/:path*', // Checkout pages need security headers
  ],
}; 