import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyRazorpaySignature } from '@/lib/curlec/utils';

// Environment variable check
if (!process.env.CURLEC_KEY_SECRET) {
  throw new Error('CURLEC_KEY_SECRET is not defined');
}

export async function POST(request: NextRequest) {
  try {
    // Add CORS headers for Razorpay
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers });
    }

    // Check for user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    }

    // Parse request body
    const body = await request.json();
    const { 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature 
    } = body;

    // Verify all parameters exist
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400, headers }
      );
    }

    // Verify the payment signature using our utility function
    const isSignatureValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id, 
      razorpay_signature,
      process.env.CURLEC_KEY_SECRET
    );

    if (!isSignatureValid) {
      console.error('Invalid signature', {
        received: razorpay_signature
      });
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400, headers }
      );
    }

    // Find the order in the database using the Curlec order ID
    const order = await prisma.order.findFirst({
      where: {
        stripeSessionId: razorpay_order_id, // Using stripeSessionId to store Curlec orderId
        userId: session.user.id
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404, headers }
      );
    }

    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PAID',
        stripePaymentIntentId: razorpay_payment_id
      }
    });

    // Always include CORS headers in your responses
    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      orderId: order.id
    }, { headers });
  } catch (error) {
    // Add the CORS headers to error responses too
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { success: false, error: 'Error verifying payment' },
      { status: 500, headers }
    );
  }
}

// Handle GET requests for redirection after payment
export async function GET(request: NextRequest) {
  // Add CORS headers for Razorpay
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const redirect = searchParams.get('redirect');
    const razorpay_payment_id = searchParams.get('razorpay_payment_id');
    const razorpay_order_id = searchParams.get('razorpay_order_id');
    const razorpay_signature = searchParams.get('razorpay_signature');

    // Log the incoming parameters for debugging
    console.log('Payment verification request:', {
      redirect,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      url: request.url
    });

    // If redirect param exists, redirect to appropriate page
    if (redirect === 'true') {
      // Get the base URL, handling localhost protocol correctly
      const host = request.headers.get('host') || 'localhost:3000';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const baseUrl = `${protocol}://${host}`;
      
      // Check if payment was successful
      if (razorpay_payment_id && razorpay_order_id && razorpay_signature) {
        // Redirect to success page
        return NextResponse.redirect(`${baseUrl}/checkout/success?payment_id=${razorpay_payment_id}`);
      } else {
        // Redirect to failure page
        return NextResponse.redirect(`${baseUrl}/checkout/cancel`);
      }
    }

    // If no redirect requested, return a simple response
    return NextResponse.json({ 
      status: 'Redirect parameter required',
      params: {
        redirect,
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature
      }
    }, { headers });
  } catch (error) {
    console.error('Error handling payment redirect:', error);
    return NextResponse.json({ 
      error: 'Error handling payment redirect',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500, headers });
  }
} 