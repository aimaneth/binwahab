/**
 * Curlec Payment Integration
 * 
 * This module provides a unified interface for interacting with the Curlec payment gateway.
 * It includes client-side and server-side functionality, utilities for working with
 * payment data, and configuration options.
 */

// Export the main client
import { createCurlecClient, createCurlecServerClient, CurlecClient } from './client';
export { createCurlecClient, createCurlecServerClient, CurlecClient };

// Export type definitions
export type { 
  CurlecCheckoutParams,
  CurlecOrderResponse,
  CurlecPaymentStatusResponse,
  VerifyPaymentParams
} from './client';

// Export utility functions
export { 
  formatCurlecAmount,
  generateCurlecSignature,
  generateOrderReferenceId,
  verifyWebhookSignature,
  formatDisplayAmount
} from './utils';

// Export configuration
export { 
  CURLEC_DEFAULT_CURRENCY,
  CURLEC_EVENT_TYPES,
  CURLEC_STATUS,
  CURLEC_PAYMENT_METHODS
} from './config';

/**
 * Initialize Curlec checkout on a specific container element
 * 
 * @example
 * ```tsx
 * // In a React component
 * import { initCurlecCheckout } from '@/lib/curlec';
 * 
 * const PaymentComponent = () => {
 *   const handlePayment = async () => {
 *     await initCurlecCheckout('checkout-container', {
 *       amount: 100.50,
 *       orderId: 'order_123',
 *       description: 'Order payment',
 *       customerName: 'John Doe',
 *       customerEmail: 'john@example.com'
 *     }, {
 *       onSuccess: (response) => console.log('Payment successful:', response),
 *       onError: (error) => console.error('Payment failed:', error),
 *       onCancel: () => console.log('Payment cancelled')
 *     });
 *   };
 * 
 *   return (
 *     <div>
 *       <div id="checkout-container"></div>
 *       <button onClick={handlePayment}>Pay Now</button>
 *     </div>
 *   );
 * };
 * ```
 */
export const initCurlecCheckout = (
  containerId: string, 
  params: import('./client').CurlecCheckoutParams,
  callbacks?: {
    onSuccess?: (response: import('./client').CurlecPaymentStatusResponse) => void;
    onError?: (error: Error) => void;
    onCancel?: () => void;
  }
) => {
  const client = createCurlecClient();
  return client.initCheckout(containerId, params, callbacks);
}; 