import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Environment variables check
if (!process.env.CURLEC_WEBHOOK_SECRET) {
  throw new Error('CURLEC_WEBHOOK_SECRET environment variable is missing');
}

/**
 * Verify webhook signature from Curlec
 */
function verifyWebhookSignature(payload: string, signature: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.CURLEC_WEBHOOK_SECRET as string)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Process payment completed event
 */
async function handlePaymentCompleted(eventData: any) {
  const { order_id, payment_id } = eventData.payload;
  
  if (!order_id || !payment_id) {
    console.error('Missing order_id or payment_id in payload', eventData);
    return false;
  }
  
  try {
    // Find the order with the Curlec order ID
    const order = await prisma.order.findFirst({
      where: {
        stripeSessionId: order_id
      }
    });
    
    if (!order) {
      console.error(`Order not found for order_id: ${order_id}`);
      return false;
    }
    
    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PAID',
        stripePaymentIntentId: payment_id
      }
    });
    
    console.log(`Payment completed for order: ${order.id}`);
    return true;
  } catch (error) {
    console.error('Error processing payment completion:', error);
    return false;
  }
}

/**
 * Process payment failed event
 */
async function handlePaymentFailed(eventData: any) {
  const { order_id, error_code, error_description } = eventData.payload;
  
  if (!order_id) {
    console.error('Missing order_id in payload', eventData);
    return false;
  }
  
  try {
    // Find the order with the Curlec order ID
    const order = await prisma.order.findFirst({
      where: {
        stripeSessionId: order_id
      }
    });
    
    if (!order) {
      console.error(`Order not found for order_id: ${order_id}`);
      return false;
    }
    
    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'FAILED'
      }
    });
    
    console.log(`Payment failed for order: ${order.id}`);
    return true;
  } catch (error) {
    console.error('Error processing payment failure:', error);
    return false;
  }
}

/**
 * Process refund completed event
 */
async function handleRefundCompleted(eventData: any) {
  const { order_id, refund_id } = eventData.payload;
  
  if (!order_id || !refund_id) {
    console.error('Missing order_id or refund_id in payload', eventData);
    return false;
  }
  
  try {
    // Find the order with the Curlec order ID
    const order = await prisma.order.findFirst({
      where: {
        stripeSessionId: order_id
      }
    });
    
    if (!order) {
      console.error(`Order not found for order_id: ${order_id}`);
      return false;
    }
    
    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'REFUNDED'
      }
    });
    
    console.log(`Refund completed for order: ${order.id}`);
    return true;
  } catch (error) {
    console.error('Error processing refund completion:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the webhook signature from the header
    const signature = request.headers.get('x-razorpay-signature');
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 400 }
      );
    }
    
    // Get the raw request body as text for signature verification
    const rawBody = await request.text();
    
    // Verify the webhook signature
    const isValidSignature = verifyWebhookSignature(rawBody, signature);
    
    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }
    
    // Parse the webhook event from the raw body
    const event = JSON.parse(rawBody);
    
    // Handle different event types
    switch (event.event) {
      case 'payment.authorized':
      case 'payment.captured':
        await handlePaymentCompleted(event);
        break;
        
      case 'payment.failed':
        await handlePaymentFailed(event);
        break;
        
      case 'refund.processed':
        await handleRefundCompleted(event);
        break;
        
      default:
        console.log(`Unhandled webhook event type: ${event.event}`);
    }
    
    // Return success response
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 