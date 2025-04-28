import { 
  CURLEC_CLIENT_ID, 
  CURLEC_MERCHANT_CODE, 
  getCurlecApiUrl,
  CURLEC_API_TIMEOUT
} from './config';
import { 
  formatCurlecAmount, 
  generateCurlecSignature, 
  generateCurlecPayloadSignature,
  generateOrderReferenceId,
  parseCurlecError
} from './utils';

/**
 * Create payment order in Curlec
 */
export interface CreateOrderParams {
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  description?: string;
  referenceId?: string;
  metadata?: Record<string, any>;
  redirectUrl?: string;
  callbackUrl?: string;
}

export interface CurlecOrderResponse {
  order_id: string;
  reference_id: string;
  checkout_url: string;
  status: string;
  created_at: string;
  expires_at: string;
}

/**
 * Create a new payment order in Curlec
 * @param params - Order parameters
 * @returns Order details including checkout URL
 */
export async function createCurlecOrder(params: CreateOrderParams): Promise<CurlecOrderResponse> {
  try {
    const { 
      amount, 
      currency, 
      customerName, 
      customerEmail, 
      customerPhone, 
      description = 'Order payment',
      referenceId = generateOrderReferenceId(),
      metadata = {},
      redirectUrl,
      callbackUrl
    } = params;
    
    const formattedAmount = formatCurlecAmount(amount);
    
    const payload = {
      client_id: CURLEC_CLIENT_ID,
      merchant_code: CURLEC_MERCHANT_CODE,
      reference_id: referenceId,
      amount: formattedAmount,
      currency,
      customer_name: customerName,
      customer_email: customerEmail,
      ...(customerPhone && { customer_phone: customerPhone }),
      description,
      ...(metadata && { metadata: JSON.stringify(metadata) }),
      ...(redirectUrl && { redirect_url: redirectUrl }),
      ...(callbackUrl && { callback_url: callbackUrl }),
    };
    
    // Generate signature
    const signature = generateCurlecPayloadSignature(payload);
    
    // Prepare request
    const response = await fetch(getCurlecApiUrl('/orders'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(CURLEC_API_TIMEOUT),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to create Curlec order: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
      );
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    const parsedError = parseCurlecError(error);
    throw new Error(`Curlec API error: ${parsedError}`);
  }
}

/**
 * Get order details from Curlec
 * @param orderId - Curlec order ID
 * @returns Order details
 */
export async function getCurlecOrder(orderId: string): Promise<any> {
  try {
    const payload = {
      client_id: CURLEC_CLIENT_ID,
      merchant_code: CURLEC_MERCHANT_CODE,
    };
    
    // Generate signature
    const signature = generateCurlecPayloadSignature(payload);
    
    // Prepare request
    const response = await fetch(getCurlecApiUrl(`/orders/${orderId}`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature,
      },
      signal: AbortSignal.timeout(CURLEC_API_TIMEOUT),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to get Curlec order: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
      );
    }
    
    return await response.json();
  } catch (error) {
    const parsedError = parseCurlecError(error);
    throw new Error(`Curlec API error: ${parsedError}`);
  }
}

/**
 * Verify payment status
 * @param orderId - Curlec order ID
 * @param paymentId - Payment ID
 * @returns Payment verification result
 */
export async function verifyCurlecPayment(orderId: string, paymentId: string): Promise<any> {
  try {
    const payload = {
      client_id: CURLEC_CLIENT_ID,
      merchant_code: CURLEC_MERCHANT_CODE,
      order_id: orderId,
      payment_id: paymentId,
    };
    
    // Generate signature using orderId and paymentId for verification
    const signature = generateCurlecSignature(orderId, paymentId);
    
    // Prepare request
    const response = await fetch(getCurlecApiUrl('/payments/verify'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(CURLEC_API_TIMEOUT),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to verify Curlec payment: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
      );
    }
    
    return await response.json();
  } catch (error) {
    const parsedError = parseCurlecError(error);
    throw new Error(`Curlec API error: ${parsedError}`);
  }
}

/**
 * Request refund for a payment
 * @param paymentId - Payment ID to refund
 * @param amount - Amount to refund (optional, defaults to full amount)
 * @param reason - Reason for refund
 * @returns Refund result
 */
export async function requestCurlecRefund(
  paymentId: string, 
  amount?: number,
  reason: string = 'Customer requested refund'
): Promise<any> {
  try {
    const payload = {
      client_id: CURLEC_CLIENT_ID,
      merchant_code: CURLEC_MERCHANT_CODE,
      payment_id: paymentId,
      reason,
      ...(amount && { amount: formatCurlecAmount(amount) }),
    };
    
    // Generate signature
    const signature = generateCurlecPayloadSignature(payload);
    
    // Prepare request
    const response = await fetch(getCurlecApiUrl('/refunds'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(CURLEC_API_TIMEOUT),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to request Curlec refund: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
      );
    }
    
    return await response.json();
  } catch (error) {
    const parsedError = parseCurlecError(error);
    throw new Error(`Curlec API error: ${parsedError}`);
  }
} 