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
    // Add CORS headers
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers });
    }

    // Parse request body
    const body = await request.json();
    const { 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature 
    } = body;

    // Log the request for debugging
    console.log('Verify payment request:', { 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature 
    });

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
        received: razorpay_signature,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id
      });
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400, headers }
      );
    }

    // Find the order in the database using the Curlec order ID
    const orderWithItems = await prisma.order.findFirst({
      where: {
        stripeSessionId: razorpay_order_id // Using stripeSessionId to store Curlec orderId
      },
      include: {
        items: {
          include: {
            variant: true
          }
        }
      }
    });

    if (!orderWithItems) {
      console.error('Order not found:', {
        razorpayOrderId: razorpay_order_id,
        paymentId: razorpay_payment_id
      });
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404, headers }
      );
    }

    // Check if payment was already processed
    if (orderWithItems.paymentStatus === 'PAID') {
      console.log('Payment already processed:', {
        orderId: orderWithItems.id,
        razorpayOrderId: razorpay_order_id
      });
      return NextResponse.json({
        success: true,
        message: 'Payment already verified',
        orderId: orderWithItems.id
      }, { headers });
    }

    try {
      // Start a transaction to update order status and inventory
      const updatedOrder = await prisma.$transaction(async (tx) => {
        // Update order status
        const updatedOrderData = await tx.order.update({
          where: { id: orderWithItems.id },
          data: {
            paymentStatus: 'PAID',
            stripePaymentIntentId: razorpay_payment_id
          }
        });

        // Update inventory for each item
        for (const item of orderWithItems.items) {
          // Check if the item has a variant and the variant has a valid ID
          if (item.variant && item.variant.id) {
            await tx.productVariant.update({
              where: { id: item.variant.id },
              data: {
                stock: {
                  decrement: item.quantity,
                },
              },
            });
          } else {
            // Log if variant or variant.id is missing for an item.
            // This might indicate a data issue or an order item that doesn't use variants.
            console.warn(
              'Skipping stock update for an item: Variant or variant.id is missing.',
              {
                orderId: orderWithItems.id,
                itemId: item.id, // Assuming 'item' has an 'id' field, adjust if not
                hasVariantObject: !!item.variant,
                variantIdFromVariantObject: item.variant ? item.variant.id : null,
              }
            );
            // Depending on business logic, you might want to handle items without variants
            // or items whose variants are unexpectedly missing an ID.
            // For now, this change will skip them and log, preventing transaction failure.
          }
        }

        return updatedOrderData;
      });

      console.log('Payment processed successfully:', {
        orderId: updatedOrder.id,
        razorpayOrderId: razorpay_order_id,
        paymentId: razorpay_payment_id
      });

      // Always include CORS headers in your responses
      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        orderId: updatedOrder.id
      }, { headers });
    } catch (error) {
      console.error('Transaction failed:', {
        error,
        orderId: orderWithItems.id,
        razorpayOrderId: razorpay_order_id
      });
      throw error; // Let the outer catch block handle the error response
    }
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
  const corsHeaders = new Headers();
  corsHeaders.set('Access-Control-Allow-Origin', '*');
  corsHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  corsHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  try {
    const searchParams = request.nextUrl.searchParams;
    const razorpay_payment_id = searchParams.get('razorpay_payment_id');
    const razorpay_order_id = searchParams.get('razorpay_order_id');
    const razorpay_signature = searchParams.get('razorpay_signature');

    console.log('[GET /api/curlec/verify-payment] Received params:', {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      keySecretCheck: process.env.CURLEC_KEY_SECRET ? `Loaded (ends with ${process.env.CURLEC_KEY_SECRET.slice(-4)})` : 'NOT LOADED',
      url: request.url
    });

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      console.error('[GET /api/curlec/verify-payment] Missing Razorpay parameters in URL');
      return NextResponse.redirect(`${baseUrl}/shop/confirmation?status=error&message=Missing+payment+parameters`);
    }

    const isSignatureValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      process.env.CURLEC_KEY_SECRET!
    );

    if (!isSignatureValid) {
      console.error('[GET /api/curlec/verify-payment] Invalid signature', {
        razorpay_order_id,
        razorpay_payment_id,
        // Do not log the full signature here for security, but confirm it was received.
        signatureReceived: !!razorpay_signature 
      });
      return NextResponse.redirect(`${baseUrl}/shop/confirmation?status=error&message=Invalid+payment+signature`);
    }

    console.log('[GET /api/curlec/verify-payment] Signature is valid. Proceeding to find and update order.');

    const order = await prisma.order.findFirst({
      where: {
        stripeSessionId: razorpay_order_id
      },
      include: {
        items: {
          include: {
            variant: true,
            product: true
          }
        }
      }
    });

    if (!order) {
      console.error('[GET /api/curlec/verify-payment] Order not found for razorpay_order_id:', razorpay_order_id);
      return NextResponse.redirect(`${baseUrl}/shop/confirmation?status=error&message=Order+details+not+found`);
    }

    if (order.paymentStatus === 'PAID') {
      console.log('[GET /api/curlec/verify-payment] Order already marked as PAID:', order.id);
      return NextResponse.redirect(`${baseUrl}/shop/confirmation?session_id=${razorpay_payment_id}&order_id=${order.id}&status=success&message=Payment+already+verified`);
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'PAID',
            stripePaymentIntentId: razorpay_payment_id
          }
        });

        for (const item of order.items) {
          if (item.variantId && item.variant) {
            await tx.productVariant.update({
              where: { id: item.variant.id },
              data: {
                stock: {
                  decrement: item.quantity
                }
              }
            });
          } else if (item.productId && item.product) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  decrement: item.quantity
                }
              }
            });
          }
        }
      });

      console.log('[GET /api/curlec/verify-payment] Order updated successfully:', order.id);
      return NextResponse.redirect(`${baseUrl}/shop/confirmation?session_id=${razorpay_payment_id}&order_id=${order.id}&status=success&message=Payment+verified+successfully`);

    } catch (transactionError) {
      console.error('[GET /api/curlec/verify-payment] Transaction failed during order update:', transactionError, { orderId: order.id });
      return NextResponse.redirect(`${baseUrl}/shop/confirmation?session_id=${razorpay_payment_id}&order_id=${order.id}&status=error&message=Failed+to+update+order+status`);
    }

  } catch (error) {
    console.error('[GET /api/curlec/verify-payment] General error:', error);
    return NextResponse.redirect(`${baseUrl}/shop/confirmation?status=error&message=Unexpected+error+during+verification`);
  }
} 