import { NextRequest, NextResponse } from 'next/server';

/**
 * Special route handler to safely process payment redirects without server action issues
 * This avoids the "Missing 'next-action' header" error by providing a server-side landing page
 * for all payment gateway redirects
 */
export async function GET(request: NextRequest) {
  try {
    // Extract all possible query parameters
    const searchParams = request.nextUrl.searchParams;
    const allParams = Object.fromEntries(searchParams.entries());
    
    // Set CORS headers to handle cross-origin redirects
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, next-action');
    
    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers });
    }
    
    // Log incoming params for debugging
    console.log('Payment redirect received with params:', allParams);
    
    // Determine a success/error status
    const isSuccess = 
      !searchParams.get('error_code') && 
      !searchParams.get('error_reason') && 
      !searchParams.get('error') && 
      (searchParams.get('razorpay_payment_id') || 
       searchParams.get('session_id') || 
       searchParams.get('payment_id') || 
       searchParams.get('status') === 'success');
    
    // Construct redirect URL to confirmation page
    const params = new URLSearchParams();
    
    // Add all the original parameters to carry them over
    Object.entries(allParams).forEach(([key, value]) => {
      params.append(key, value);
    });
    
    // Ensure we have a status parameter
    if (!params.has('status')) {
      params.append('status', isSuccess ? 'success' : 'error');
    }
    
    // Add an explicit message to avoid client-side lookups
    if (!params.has('message')) {
      params.append('message', isSuccess 
        ? 'Your payment has been processed successfully.' 
        : 'There was an issue processing your payment.');
    }
    
    // Create the redirect URL
    const redirectUrl = `/shop/confirmation?${params.toString()}`;
    
    // Return a redirect response with appropriate headers
    return NextResponse.redirect(new URL(redirectUrl, request.url), {
      status: 303, // Use 303 See Other for redirects after POST
      headers
    });
  } catch (error) {
    console.error('Error in payment redirect handler:', error);
    
    // Fallback redirect to the confirmation page with error status
    return NextResponse.redirect(
      new URL('/shop/confirmation?status=error&message=Unexpected+error+during+payment+processing', request.url), 
      { status: 303 }
    );
  }
} 