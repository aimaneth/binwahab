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

/**
 * POST handler for payment gateway callbacks
 * Many payment gateways use POST for callbacks, so we need to handle both GET and POST
 */
export async function POST(request: NextRequest) {
  try {
    // Process both body and query parameters for POST requests
    const searchParams = request.nextUrl.searchParams;
    const allParams = Object.fromEntries(searchParams.entries());
    
    // Get body parameters if present
    let bodyParams: Record<string, any> = {};
    try {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const body = await request.json();
        bodyParams = body;
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData();
        bodyParams = Object.fromEntries(formData.entries());
      }
    } catch (e) {
      console.warn('Could not parse request body:', e);
    }
    
    // Merge body and query parameters, with body taking precedence
    const mergedParams: Record<string, any> = { ...allParams, ...bodyParams };
    
    // Set CORS headers
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, next-action');
    
    // Log incoming params for debugging
    console.log('Payment POST callback received with params:', mergedParams);
    
    // Determine success/error status
    const isSuccess = 
      !mergedParams['error_code'] && 
      !mergedParams['error_reason'] && 
      !mergedParams['error'] && 
      (mergedParams['razorpay_payment_id'] || 
       mergedParams['session_id'] || 
       mergedParams['payment_id'] || 
       mergedParams['status'] === 'success');
    
    // Construct redirect URL parameters
    const params = new URLSearchParams();
    
    // Add all parameters to carry them over
    Object.entries(mergedParams).forEach(([key, value]) => {
      params.append(key, String(value));
    });
    
    // Ensure we have a status parameter
    if (!params.has('status')) {
      params.append('status', isSuccess ? 'success' : 'error');
    }
    
    // Add an explicit message
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
    console.error('Error in payment POST handler:', error);
    
    // Fallback redirect
    return NextResponse.redirect(
      new URL('/shop/confirmation?status=error&message=Unexpected+error+during+payment+processing', request.url), 
      { status: 303 }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 * This is needed for browsers to check if the actual request is allowed
 */
export async function OPTIONS(request: NextRequest) {
  const headers = new Headers();
  
  // Set CORS headers for preflight requests
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, next-action, x-csrf-token, x-requested-with, accept, accept-version, content-length, content-md5, date, x-api-version');
  headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Return 204 No Content for preflight requests
  return new NextResponse(null, { 
    status: 204, 
    headers 
  });
} 