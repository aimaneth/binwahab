import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
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
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; connect-src 'self' https://api.stripe.com https://m.stripe.network https://fonts.googleapis.com https://fonts.gstatic.com https://*.uploadthing.com https://*.utfs.io; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://*.stripe.com https://*.stripe.network https://stripe-camo.global.ssl.fastly.net https://*.uploadthing.com https://*.utfs.io https://*.ufs.sh; frame-src 'self' https://js.stripe.com https://hooks.stripe.com; worker-src 'self' blob:;"
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

async function trackPageView(request: NextRequest): Promise<string | null> {
  if (!redis) {
    console.warn('Redis not available for page view tracking');
    return null;
  }

  try {
    const page = request.nextUrl.pathname;
    const date = new Date().toISOString().split('T')[0];
    const sessionId = request.cookies.get('session_id')?.value || nanoid();
    const userAgent = request.headers.get('user-agent') || '';
    const parser = new UAParser(userAgent);
    const deviceType = parser.getDevice().type || 'unknown';
    const browser = parser.getBrowser().name || 'unknown';

    const pageKey = `page:${date}:${page}`;
    const uniqueKey = `unique:${date}:${page}:${sessionId}`;

    const isNewVisitor = await redis.get(uniqueKey) === null;

    const operations = [
      redis.incr(`${pageKey}:views`),
      isNewVisitor ? redis.setex(uniqueKey, 86400, '1') : null, // 24 hours TTL
      isNewVisitor ? redis.incr(`${pageKey}:unique`) : null,
      redis.sadd(`${pageKey}:devices`, deviceType),
      redis.sadd(`${pageKey}:browsers`, browser),
    ].filter((op): op is Promise<any> => op !== null);

    await Promise.all(operations);

    return sessionId;
  } catch (error) {
    console.error('Error tracking page view:', error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  try {
    // Skip tracking for excluded paths
    if (EXCLUDED_PATHS.some(path => request.nextUrl.pathname.startsWith(path))) {
      return NextResponse.next();
    }

    const response = NextResponse.next();
    const sessionId = await trackPageView(request);

    if (sessionId) {
      response.cookies.set('session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return response;
  } catch (error) {
    console.error('[MIDDLEWARE_ERROR]', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}; 