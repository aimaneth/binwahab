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
          if (item.variant) {
            await tx.productVariant.update({
              where: { id: item.variant.id },
              data: {
                stock: {
                  decrement: item.quantity
                }
              }
            });
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
  // Add CORS headers
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
    const order_id = searchParams.get('order_id');

    // Log the incoming parameters for debugging
    console.log('Payment verification redirect request:', {
      redirect,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      order_id,
      url: request.url
    });

    // Get the base URL, handling localhost protocol correctly
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    // If redirect param exists, handle redirection
    if (redirect === 'true') {
      // If we have Razorpay parameters, verify the payment
      if (razorpay_payment_id && razorpay_order_id && razorpay_signature) {
        // Find the order to include in the success URL
        try {
          const order = await prisma.order.findFirst({
            where: {
              stripeSessionId: razorpay_order_id
            },
            include: {
              items: {
                include: {
                  variant: true
                }
              }
            }
          });

          if (order) {
            // Update order status if needed
            if (order.paymentStatus !== 'PAID') {
              // Use transaction to update both order status and inventory
              await prisma.$transaction(async (tx) => {
                await tx.order.update({
                  where: { id: order.id },
                  data: {
                    paymentStatus: 'PAID',
                    stripePaymentIntentId: razorpay_payment_id
                  }
                });

                // Update inventory for each item
                for (const item of order.items) {
                  if (item.variant) {
                    await tx.productVariant.update({
                      where: { id: item.variant.id },
                      data: {
                        stock: {
                          decrement: item.quantity
                        }
                      }
                    });
                  }
                }
              });
            }
            
            // Redirect to success page with internal order ID
            return NextResponse.redirect(`${baseUrl}/shop/checkout/success?payment_id=${razorpay_payment_id}&order_id=${order.id}`);
          }
        } catch (dbError) {
          console.error('Database error during redirect:', dbError);
        }
        
        // If no order found, redirect to cancel
        return NextResponse.redirect(`${baseUrl}/shop/checkout/cancel`);
      } 
      // If we have just the order_id, try to find it (this might be our internal ID)
      else if (order_id) {
        try {
          // First try to find by internal ID
          let order = await prisma.order.findUnique({
            where: {
              id: order_id
            }
          });

          // If not found, try to find by Razorpay order ID
          if (!order) {
            order = await prisma.order.findFirst({
              where: {
                stripeSessionId: order_id
              }
            });
          }

          if (order) {
            // If the order exists and is paid, redirect to success
            if (order.paymentStatus === 'PAID') {
              return NextResponse.redirect(`${baseUrl}/shop/checkout/success?order_id=${order.id}`);
            }
            // If the order exists but isn't paid, redirect to cancel
            else {
              return NextResponse.redirect(`${baseUrl}/shop/checkout/cancel`);
            }
          }
        } catch (dbError) {
          console.error('Database error during order lookup:', dbError);
        }
      }
      
      // If we get here, something went wrong - redirect to cancel
      return NextResponse.redirect(`${baseUrl}/shop/checkout/cancel`);
    }

    // If no redirect requested, return a simple response
    return NextResponse.json({ 
      status: 'Redirect parameter required',
      params: {
        redirect,
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        order_id
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