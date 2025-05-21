import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRazorpaySignature } from '@/lib/curlec/utils';

export async function GET(request: NextRequest) {
  try {
    // Add CORS headers
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Get URL parameters
    const searchParams = request.nextUrl.searchParams;
    const razorpay_payment_id = searchParams.get('razorpay_payment_id');
    const razorpay_order_id = searchParams.get('razorpay_order_id');
    const razorpay_signature = searchParams.get('razorpay_signature');
    const payment_id = searchParams.get('payment_id') || razorpay_payment_id;
    const order_id = searchParams.get('order_id') || razorpay_order_id;
    
    // Check for error or cancellation
    const error_code = searchParams.get('error_code');
    const error_description = searchParams.get('error_description');
    const error_source = searchParams.get('error_source');
    const error_reason = searchParams.get('error_reason');
    
    console.log('[GET /api/curlec/verify-direct] Received params:', {
      payment_id,
      order_id,
      razorpay_signature,
      error_code,
      error_description,
      error_source,
      error_reason
    });

    // If there's an error code or source, it means the payment was cancelled or failed
    if (error_code || error_source || error_reason) {
      const errorMessage = error_description || error_reason || 'Payment was cancelled or failed';
      console.error('[GET /api/curlec/verify-direct] Payment error:', {
        error_code,
        error_description,
        error_source,
        error_reason,
      });
      return NextResponse.json({
        success: false,
        error: errorMessage
      }, { headers });
    }

    // If we have a signature, verify it
    if (razorpay_payment_id && razorpay_order_id && razorpay_signature && process.env.CURLEC_KEY_SECRET) {
      const isSignatureValid = verifyRazorpaySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        process.env.CURLEC_KEY_SECRET
      );

      if (!isSignatureValid) {
        console.error('[GET /api/curlec/verify-direct] Invalid signature', {
          razorpay_order_id,
          razorpay_payment_id
        });
        return NextResponse.json({
          success: false,
          error: 'Invalid payment signature'
        }, { headers });
      }

      // Find and update the order
      const order = await prisma.order.findFirst({
        where: { stripeSessionId: razorpay_order_id }
      });

      if (!order) {
        console.error('[GET /api/curlec/verify-direct] Order not found for order_id:', razorpay_order_id);
        return NextResponse.json({
          success: false,
          error: 'Order details not found'
        }, { headers });
      }

      if (order.paymentStatus === 'PAID') {
        return NextResponse.json({
          success: true,
          message: 'Payment already verified',
          orderId: order.id
        }, { headers });
      }

      // Update the order status
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          stripePaymentIntentId: razorpay_payment_id
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        orderId: order.id
      }, { headers });
    }

    // Fallback for simple payment_id check without signature
    if (payment_id || order_id) {
      // Try to find the order
      const whereClause = payment_id 
        ? { stripePaymentIntentId: payment_id }
        : { stripeSessionId: order_id };
      
      const order = await prisma.order.findFirst({ where: whereClause });
      
      if (order) {
        return NextResponse.json({
          success: true,
          message: 'Order found',
          orderId: order.id,
          paymentStatus: order.paymentStatus
        }, { headers });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Missing required payment information'
    }, { headers });
  } catch (error) {
    console.error('[GET /api/curlec/verify-direct] General error:', error);
    
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return NextResponse.json({
      success: false,
      error: 'Unexpected error during verification'
    }, { status: 500, headers });
  }
} 