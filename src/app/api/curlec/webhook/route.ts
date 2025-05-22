import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRazorpaySignature } from '@/lib/curlec/utils';
import { PaymentMethod } from '@prisma/client';

// Helper function to determine payment method from the webhook payload
function determinePaymentMethod(payload: any): PaymentMethod {
  const paymentEntity = payload?.payload?.payment?.entity || {};
  const method = paymentEntity.method;
  const wallet = paymentEntity.wallet;
  const bank = paymentEntity.bank;
  const card = paymentEntity.card;
  
  // Check payment method directly if available
  if (method) {
    if (method === 'card' || method === 'credit_card') return PaymentMethod.CREDIT_CARD;
    if (method === 'netbanking' || method === 'bank_transfer' || method === 'fpx') return PaymentMethod.BANK_TRANSFER;
    if (method === 'wallet' || method === 'upi') return PaymentMethod.PAYPAL; // Using PAYPAL for wallets
  }
  
  // Check more specific attributes
  if (wallet) return PaymentMethod.PAYPAL; // Using PAYPAL for wallet payments
  if (bank) return PaymentMethod.BANK_TRANSFER;
  if (card) return PaymentMethod.CREDIT_CARD;
  
  // Default to credit card if we can't determine the method
  return PaymentMethod.CREDIT_CARD;
}

// This webhook is for server-to-server communication from Curlec
// It doesn't involve the user's browser directly
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const requestText = await request.clone().text();
    console.log('[POST /api/curlec/webhook] Received webhook payload:', requestText);

    let payload;
    try {
      payload = JSON.parse(requestText);
    } catch (error) {
      console.error('[POST /api/curlec/webhook] Error parsing JSON:', error);
      try {
        // Try to parse as form data if not valid JSON
        const formData = await request.formData();
        payload = Object.fromEntries(formData.entries());
      } catch (formError) {
        console.error('[POST /api/curlec/webhook] Error parsing form data:', formError);
        return NextResponse.json({ error: 'Invalid payload format' }, { status: 400 });
      }
    }

    // Extract the event name from the payload
    const event = payload.event;
    if (!event) {
      console.error('[POST /api/curlec/webhook] No event specified in webhook');
      return NextResponse.json({ error: 'No event specified' }, { status: 400 });
    }

    console.log(`[POST /api/curlec/webhook] Processing ${event} event`);

    // Handle different event types
    switch (event) {
      case 'payment.authorized':
      case 'payment.captured':
        await handleSuccessfulPayment(payload);
        break;
      
      case 'payment.failed':
        await handleFailedPayment(payload);
        break;
      
      default:
        console.log(`[POST /api/curlec/webhook] Unhandled event type: ${event}`);
    }

    // Return 200 OK to acknowledge receipt of the webhook
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[POST /api/curlec/webhook] Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleSuccessfulPayment(payload: any) {
  const { order_id, payment_id } = payload?.payload?.payment?.entity || {};
  
  if (!order_id) {
    console.error('[Webhook] Missing order_id in payment entity');
    return;
  }

  // Determine the payment method used
  const paymentMethod = determinePaymentMethod(payload);
  console.log(`[Webhook] Detected payment method: ${paymentMethod}`);

  try {
    // Find the order using the Curlec order ID
    const order = await prisma.order.findFirst({
      where: {
        stripeSessionId: order_id
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
      console.error(`[Webhook] Order not found for order_id: ${order_id}`);
      return;
    }

    // If order is already paid, don't process again
    if (order.paymentStatus === 'PAID') {
      console.log(`[Webhook] Order ${order.id} was already marked as paid`);
      return;
    }

    // Update order and inventory in a transaction
    await prisma.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          paymentMethod: paymentMethod, // Set the detected payment method
          stripePaymentIntentId: payment_id || order.stripePaymentIntentId
        }
      });

      // Update inventory for each item
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

    console.log(`[Webhook] Successfully updated order ${order.id} status to PAID with payment method ${paymentMethod}`);
  } catch (error) {
    console.error(`[Webhook] Error updating order for ${order_id}:`, error);
    throw error;
  }
}

async function handleFailedPayment(payload: any) {
  const { order_id } = payload?.payload?.payment?.entity || {};
  
  if (!order_id) {
    console.error('[Webhook] Missing order_id in failed payment entity');
    return;
  }

  try {
    // Find the order using the Curlec order ID
    const order = await prisma.order.findFirst({
      where: {
        stripeSessionId: order_id
      }
    });

    if (!order) {
      console.error(`[Webhook] Order not found for order_id: ${order_id}`);
      return;
    }

    // Update the order status to FAILED
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'FAILED'
      }
    });

    console.log(`[Webhook] Updated order ${order.id} status to FAILED`);
  } catch (error) {
    console.error(`[Webhook] Error updating failed payment status for ${order_id}:`, error);
    throw error;
  }
} 