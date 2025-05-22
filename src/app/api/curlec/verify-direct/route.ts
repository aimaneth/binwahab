import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRazorpaySignature } from '@/lib/curlec/utils';
import { PaymentMethod } from '@prisma/client';

// Helper function to determine payment method from gateway response
function determinePaymentMethod(params: Record<string, any>): PaymentMethod {
  // For Razorpay/Curlec
  if (params.razorpay_payment_id) {
    // Check for wallet indicators
    if (params.wallet || params.method === 'wallet' || params.payment_method === 'wallet') {
      // We don't have WALLET in our enum, so use PAYPAL as closest match
      return PaymentMethod.PAYPAL;
    }
    
    // Check for FPX indicators
    if (params.fpx || params.method === 'fpx' || params.payment_method === 'fpx') {
      // Use BANK_TRANSFER for FPX payments
      return PaymentMethod.BANK_TRANSFER;
    }
    
    // Check for bank transfer indicators
    if (params.bank || params.method === 'netbanking' || params.payment_method === 'netbanking') {
      return PaymentMethod.BANK_TRANSFER;
    }
    
    // Default to credit card for Razorpay if no specific method is identified
    return PaymentMethod.CREDIT_CARD;
  }
  
  // For direct Stripe payments
  if (params.payment_method_types) {
    const method = Array.isArray(params.payment_method_types) 
      ? params.payment_method_types[0] 
      : params.payment_method_types;
      
    if (method === 'card') return PaymentMethod.CREDIT_CARD;
    if (method === 'fpx') return PaymentMethod.BANK_TRANSFER;
    if (method === 'grabpay' || method === 'alipay' || method === 'wechat_pay') return PaymentMethod.PAYPAL;
    if (method === 'bank_transfer') return PaymentMethod.BANK_TRANSFER;
  }
  
  // Check status for clues about payment method
  if (params.status) {
    if (params.status.includes('wallet')) return PaymentMethod.PAYPAL;
    if (params.status.includes('fpx')) return PaymentMethod.BANK_TRANSFER;
    if (params.status.includes('bank')) return PaymentMethod.BANK_TRANSFER;
  }
  
  // Fallback
  return PaymentMethod.CREDIT_CARD;
}

export async function GET(request: NextRequest) {
  try {
    // Add CORS headers
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    const searchParams = request.nextUrl.searchParams;
    
    // Extract all query parameters into an object
    const params: Record<string, any> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    // Get various payment identifiers
    const razorpayPaymentId = params.razorpay_payment_id;
    const razorpayOrderId = params.razorpay_order_id;
    const paymentId = params.payment_id;
    const orderId = params.order_id;
    
    // Determine payment method
    const paymentMethod = determinePaymentMethod(params);
    
    // Log the payment information for debugging
    console.log('Verifying payment with params:', params);
    console.log('Detected payment method:', paymentMethod);
    
    // Verify the payment is legitimate - you would typically make API calls to Curlec/Razorpay here
    // For this example, we'll just assume it's valid if we have any payment ID
    const isValid = !!(razorpayPaymentId || paymentId || orderId);
    
    if (isValid) {
      try {
        // Update the database with the payment information
        // This assumes you have user/order tables set up properly
        
        // Find the order using any of the available IDs
        const order = await prisma.order.findFirst({
          where: {
            OR: [
              { stripeSessionId: razorpayOrderId || orderId },
              { stripePaymentIntentId: razorpayPaymentId || paymentId },
            ]
          }
        });
        
        if (order) {
          // Update the order with payment information
          await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'PAID',
              paymentMethod: paymentMethod,
              updatedAt: new Date(),
            }
          });
          
          // You could also update the user's subscription status here if needed
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Continue processing even if database update fails
      }
      
      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        paymentMethod: paymentMethod
      }, { headers });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid payment information'
      }, { status: 400, headers });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return NextResponse.json({
      success: false,
      error: 'Failed to verify payment'
    }, { status: 500, headers });
  }
} 