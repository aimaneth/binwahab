import { createHmac } from 'crypto';
import { CURLEC_CLIENT_SECRET } from './config';

/**
 * Formats amount for Curlec API (converts to smallest currency unit)
 * @param amount Amount to format (e.g., 19.99)
 * @returns Formatted amount (e.g., 1999)
 */
export function formatCurlecAmount(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Generates a Curlec signature for payment verification
 * @param orderId Curlec order ID
 * @param paymentId Curlec payment ID
 * @param secret Curlec secret key
 * @returns Generated signature
 */
export function generateCurlecSignature(
  orderId: string,
  paymentId: string,
  secret: string = CURLEC_CLIENT_SECRET
): string {
  // According to Razorpay docs, the signature is an HMAC of "order_id|payment_id" using the secret key
  const data = `${orderId}|${paymentId}`;
  return createHmac('sha256', secret)
    .update(data)
    .digest('hex');
}

/**
 * Verify payment signature from Razorpay
 * @param orderId Original order ID (not the razorpay_order_id)
 * @param paymentId Payment ID (razorpay_payment_id)
 * @param signature Signature from Razorpay (razorpay_signature)
 * @param secret Secret key
 * @returns Whether the signature is valid
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string = CURLEC_CLIENT_SECRET
): boolean {
  const generatedSignature = generateCurlecSignature(orderId, paymentId, secret);
  return generatedSignature === signature;
}

/**
 * Generates a Curlec signature for API requests
 * @param payload The payload to sign
 * @param secret Curlec secret key
 * @returns Generated signature
 */
export function generateCurlecPayloadSignature(
  payload: Record<string, any>,
  secret: string = CURLEC_CLIENT_SECRET
): string {
  // Sort keys alphabetically and create a string of key=value pairs
  const sortedKeys = Object.keys(payload).sort();
  const dataString = sortedKeys
    .map(key => `${key}=${payload[key]}`)
    .join('&');
  
  return createHmac('sha256', secret)
    .update(dataString)
    .digest('hex');
}

/**
 * Verifies a webhook signature from Curlec
 * @param payload Raw webhook payload
 * @param signature Signature from webhook headers
 * @param secret Curlec secret key
 * @returns Whether the signature is valid
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string = CURLEC_CLIENT_SECRET
): boolean {
  const computedSignature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return computedSignature === signature;
}

/**
 * Generates a unique order reference ID
 * @returns Generated order reference ID
 */
export function generateOrderReferenceId(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `order_${timestamp}_${random}`;
}

/**
 * Parse and format Curlec errors
 * @param error Error from Curlec API or client-side error
 * @returns Formatted error message
 */
export function parseCurlecError(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'Unknown error occurred with Curlec payment processing';
}

/**
 * Parses and validates a Curlec API response
 * @param response Raw API response
 * @returns Parsed response or throws an error
 */
export function parseCurlecResponse<T>(response: any): T {
  if (!response) {
    throw new Error('Empty response from Curlec API');
  }
  
  if (response.error) {
    throw new Error(response.error.description || 'Unknown error from Curlec API');
  }
  
  return response as T;
}

/**
 * Formats an amount for display (e.g., MYR 19.99)
 * @param amount Amount in smallest currency unit (e.g., 1999)
 * @param currency Currency code (e.g., MYR)
 * @returns Formatted amount string
 */
export function formatDisplayAmount(amount: number, currency: string = 'MYR'): string {
  const amountInMajorUnit = amount / 100;
  return `${currency} ${amountInMajorUnit.toFixed(2)}`;
} 