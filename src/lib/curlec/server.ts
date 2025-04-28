import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

// Validate environment variables
if (!process.env.CURLEC_KEY_ID) {
  throw new Error('CURLEC_KEY_ID is not defined');
}

if (!process.env.CURLEC_KEY_SECRET) {
  throw new Error('CURLEC_KEY_SECRET is not defined');
}

// Constants
const CURLEC_API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.curlec.com/v1'
  : 'https://api.curlec.com/v1';

// Helper functions for Curlec
export const formatAmountForCurlec = (amount: number): number => {
  // Convert to sen (in Malaysia)
  return Math.round(amount * 100);
};

// Create an order in Curlec
export async function createCurlecOrder(amount: number, currency: string, receipt?: string) {
  try {
    const orderData = {
      amount: formatAmountForCurlec(amount),
      currency: currency,
      receipt: receipt || `order_${Date.now()}`,
      notes: {
        source: 'BINWAHAB Shop',
      }
    };

    // Make API request to Curlec Orders API
    const response = await fetch(`${CURLEC_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${process.env.CURLEC_KEY_ID}:${process.env.CURLEC_KEY_SECRET}`).toString('base64')}`
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Curlec order creation failed:', errorData);
      throw new Error(`Curlec error: ${errorData.error?.description || 'Unknown error'}`);
    }

    const orderResponse = await response.json();
    return orderResponse;
  } catch (error) {
    console.error('Error creating Curlec order:', error);
    throw new Error('Failed to create Curlec order');
  }
}

// Store Curlec order information in database
export async function storeCurlecOrder(userId: string, orderId: string, amount: number) {
  try {
    // Find if the user has an existing order that's pending
    const existingOrder = await prisma.order.findFirst({
      where: {
        userId,
        paymentStatus: "PENDING"
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (existingOrder) {
      // Update existing order with Curlec orderId
      await prisma.order.update({
        where: { id: existingOrder.id },
        data: {
          // We're using the stripeSessionId field to store the Curlec orderId
          // since we're supporting multiple payment gateways
          stripeSessionId: orderId
        }
      });
      return existingOrder.id;
    }
    
    // If no existing order, this is handled separately when creating a checkout
    return null;
  } catch (error) {
    console.error('Error storing Curlec order:', error);
    // Don't throw here, just log the error
    return null;
  }
}

// Verify Curlec payment signature
export function verifyCurlecPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
) {
  try {
    // Create signature using HMAC SHA256
    const data = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.CURLEC_KEY_SECRET!)
      .update(data)
      .digest('hex');
    
    // Compare signatures
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  } catch (error) {
    console.error('Error verifying Curlec payment signature:', error);
    return false;
  }
}

// Webhook event verification
export function verifyCurlecWebhookSignature(payload: string, signature: string) {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.CURLEC_WEBHOOK_SECRET!)
      .update(payload)
      .digest('hex');
    
    return expectedSignature === signature;
  } catch (error) {
    console.error('Error verifying Curlec webhook signature:', error);
    return false;
  }
} 