// Client-side functions for Curlec payments

import {
  CURLEC_CLIENT_ID,
  CURLEC_CLIENT_SECRET,
  CURLEC_API_TIMEOUT,
  CURLEC_API_BASE_URL,
  CURLEC_SDK_URL,
  CURLEC_DEFAULT_CURRENCY,
  CURLEC_ENDPOINTS,
  CurlecClientOptions,
  getClientConfig
} from './config';

import { formatCurlecAmount, generateCurlecSignature, parseCurlecError, parseCurlecResponse } from './utils';

/**
 * Params for creating a checkout session
 */
export interface CurlecCheckoutParams {
  amount: number;
  currency?: string;
  orderId: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  description?: string;
  callbackUrl?: string;
  redirectUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Response from creating an order
 */
export interface CurlecOrderResponse {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  checkoutUrl?: string;
}

/**
 * Request params for verifying a payment
 */
export interface VerifyPaymentParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

/**
 * Response from verifying a payment
 */
export interface CurlecPaymentStatusResponse {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  paidAt?: string;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * Global declaration for the Curlec JavaScript SDK
 */
declare global {
  interface Window {
    Curlec: any;
    CurlecCheckout?: {
      init: (params: any) => void;
    };
  }
}

/**
 * CurlecClient provides methods for interacting with Curlec payment gateway
 * Can be used in both frontend and backend contexts
 */
export class CurlecClient {
  private apiUrl: string;
  private clientId: string;
  private clientSecret: string;
  private timeout: number;
  private currency: string;
  private isBrowser: boolean;
  
  /**
   * Create a new Curlec client
   * @param options Client configuration options
   */
  constructor(options?: CurlecClientOptions) {
    const config = getClientConfig(options);
    
    this.apiUrl = config.apiUrl;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.timeout = config.timeout;
    this.currency = config.currency;
    this.isBrowser = typeof window !== 'undefined';
  }
  
  /**
   * Create a new order for payment
   * @param params Order parameters
   * @returns Order creation response
   */
  async createOrder(params: CurlecCheckoutParams): Promise<CurlecOrderResponse> {
    // Format amount to integer (cents)
    const amount = formatCurlecAmount(params.amount);
    
    // Use default currency if not specified
    const currency = params.currency || this.currency;
    
    const payload = {
      amount,
      currency,
      order_id: params.orderId,
      customer_email: params.customerEmail || undefined,
      customer_name: params.customerName || undefined,
      customer_phone: params.customerPhone || undefined,
      description: params.description || undefined,
      callback_url: params.callbackUrl || undefined,
      redirect_url: params.redirectUrl || undefined,
      metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
    };
    
    try {
      // If we're in the browser, call the local API endpoint
      if (this.isBrowser) {
        const response = await this.fetchApi('/api/curlec/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        return parseCurlecResponse<CurlecOrderResponse>(response);
      }
      
      // If we're on the server, call the Curlec API directly
      const endpoint = `${this.apiUrl}${CURLEC_ENDPOINTS.CREATE_ORDER}`;
      const response = await this.fetchApi(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.clientId}:${this.clientSecret}`,
        },
        body: JSON.stringify(payload),
      });
      
      return parseCurlecResponse<CurlecOrderResponse>(response);
    } catch (error) {
      const errorMessage = parseCurlecError(error);
      throw new Error(`Failed to create Curlec order: ${errorMessage}`);
    }
  }
  
  /**
   * Verify a payment
   * @param params Verification parameters
   * @returns Payment verification response
   */
  async verifyPayment(params: VerifyPaymentParams): Promise<CurlecPaymentStatusResponse> {
    try {
      // If we're in the browser, call the local API endpoint
      if (this.isBrowser) {
        const response = await this.fetchApi('/api/curlec/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: params.orderId,
            paymentId: params.paymentId,
            signature: params.signature,
          }),
        });
        
        return parseCurlecResponse<CurlecPaymentStatusResponse>(response);
      }
      
      // If we're on the server, call the Curlec API directly
      // Generate the signature if not provided
      const signature = params.signature || generateCurlecSignature(
        params.orderId,
        params.paymentId,
        this.clientSecret
      );
      
      const endpoint = `${this.apiUrl}${CURLEC_ENDPOINTS.VERIFY_PAYMENT}`;
      const response = await this.fetchApi(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.clientId}:${this.clientSecret}`,
        },
        body: JSON.stringify({
          order_id: params.orderId,
          payment_id: params.paymentId,
          signature,
        }),
      });
      
      return parseCurlecResponse<CurlecPaymentStatusResponse>(response);
    } catch (error) {
      const errorMessage = parseCurlecError(error);
      throw new Error(`Failed to verify Curlec payment: ${errorMessage}`);
    }
  }
  
  /**
   * Check payment status
   * @param paymentId Payment ID
   * @returns Payment status response
   */
  async checkPaymentStatus(paymentId: string): Promise<CurlecPaymentStatusResponse> {
    try {
      // If we're in the browser, call through our API endpoint
      if (this.isBrowser) {
        const response = await this.fetchApi(`/api/curlec/payment-status/${paymentId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        return parseCurlecResponse<CurlecPaymentStatusResponse>(response);
      }
      
      // If on server, call Curlec API directly
      const endpoint = `${this.apiUrl}${CURLEC_ENDPOINTS.PAYMENT_STATUS}/${paymentId}`;
      const response = await this.fetchApi(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.clientId}:${this.clientSecret}`,
        },
      });
      
      return parseCurlecResponse<CurlecPaymentStatusResponse>(response);
    } catch (error) {
      const errorMessage = parseCurlecError(error);
      throw new Error(`Failed to check Curlec payment status: ${errorMessage}`);
    }
  }
  
  /**
   * Initialize the checkout form
   * Client-side only
   * @param containerId HTML container ID
   * @param params Checkout parameters
   * @param callbacks Callback functions
   */
  initCheckout(
    containerId: string,
    params: CurlecCheckoutParams,
    callbacks?: {
      onSuccess?: (response: CurlecPaymentStatusResponse) => void;
      onError?: (error: Error) => void;
      onCancel?: () => void;
    }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isBrowser) {
        reject(new Error('Checkout initialization is only available in the browser'));
        return;
      }
      
      // Load the Curlec SDK if not already loaded
      this.loadCurlecSdk()
        .then(() => this.createOrder(params))
        .then(order => {
          // Initialize the checkout form
          if (!window.CurlecCheckout) {
            reject(new Error('Curlec SDK not loaded properly'));
            return;
          }
          
          const checkoutContainer = document.getElementById(containerId);
          if (!checkoutContainer) {
            reject(new Error(`Container with ID '${containerId}' not found`));
            return;
          }
          
          window.CurlecCheckout.init({
            containerId,
            orderId: order.id,
            onSuccess: (response: any) => {
              // Verify the payment on success
              this.verifyPayment({
                orderId: order.orderId,
                paymentId: response.paymentId,
                signature: response.signature,
              })
                .then(verificationResult => {
                  if (callbacks?.onSuccess) {
                    callbacks.onSuccess(verificationResult);
                  }
                  resolve();
                })
                .catch(error => {
                  if (callbacks?.onError) {
                    callbacks.onError(error instanceof Error ? error : new Error(String(error)));
                  }
                  reject(error);
                });
            },
            onError: (error: any) => {
              const parsedError = new Error(parseCurlecError(error));
              if (callbacks?.onError) {
                callbacks.onError(parsedError);
              }
              reject(parsedError);
            },
            onCancel: () => {
              if (callbacks?.onCancel) {
                callbacks.onCancel();
              }
              resolve();
            },
          });
        })
        .catch(error => {
          if (callbacks?.onError) {
            callbacks.onError(error instanceof Error ? error : new Error(String(error)));
          }
          reject(error);
        });
    });
  }
  
  /**
   * Load the Curlec SDK dynamically
   * Client-side only
   */
  private loadCurlecSdk(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isBrowser) {
        reject(new Error('SDK loading is only available in the browser'));
        return;
      }
      
      // If already loaded, resolve immediately
      if (window.CurlecCheckout) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = CURLEC_SDK_URL;
      script.async = true;
      
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Curlec SDK'));
      
      document.head.appendChild(script);
    });
  }
  
  /**
   * Make an API request with timeout and error handling
   * @param url API endpoint
   * @param options Fetch options
   * @returns Response data
   */
  private async fetchApi(url: string, options: RequestInit = {}): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText };
        }
        
        throw {
          status: response.status,
          statusText: response.statusText,
          data: errorData,
        };
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timed out after ${this.timeout / 1000} seconds`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Create a client for server-side usage
 * @param options Client options
 * @returns Curlec client instance
 */
export function createCurlecServerClient(options?: CurlecClientOptions): CurlecClient {
  return new CurlecClient({
    apiUrl: CURLEC_API_BASE_URL,
    clientId: CURLEC_CLIENT_ID,
    clientSecret: CURLEC_CLIENT_SECRET,
    currency: CURLEC_DEFAULT_CURRENCY,
    timeout: CURLEC_API_TIMEOUT,
    ...options,
  });
}

/**
 * Create a client for client-side usage
 * @param options Client options
 * @returns Curlec client instance
 */
export function createCurlecClient(options?: CurlecClientOptions): CurlecClient {
  return new CurlecClient({
    apiUrl: '/api/curlec', // We'll proxy through our own API
    currency: CURLEC_DEFAULT_CURRENCY,
    timeout: CURLEC_API_TIMEOUT,
    ...options,
  });
}

/**
 * Default export for convenience
 */
export default createCurlecClient;

/**
 * Interface for checkout options
 */
export interface CurlecCheckoutOptions {
  key: string;
  orderId: string;
  amount: number;
  currency?: string;
  name?: string;
  description?: string;
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  callbackUrl?: string;
  redirect?: boolean;
  theme?: {
    color?: string;
  };
}

/**
 * Create options for Curlec checkout
 * @param options Checkout configuration options
 * @returns Formatted checkout options for Razorpay
 */
export function createCurlecCheckoutOptions(options: CurlecCheckoutOptions): any {
  return {
    key: options.key,
    amount: Math.round(options.amount * 100).toString(),
    currency: options.currency || 'MYR',
    name: options.name || 'BINWAHAB Shop',
    description: options.description || 'Payment for your order',
    image: options.image || 'https://binwahab.com/images/logo.png',
    order_id: options.orderId,
    callback_url: options.callbackUrl,
    redirect: options.redirect,
    prefill: {
      name: options.prefill?.name || undefined,
      email: options.prefill?.email || undefined,
      contact: options.prefill?.contact || undefined,
    },
    theme: {
      color: options.theme?.color || '#6366F1'
    },
    modal: {
      escape: true,
      animation: true
    },
    handler: function(response: any) {
      console.log('Payment successful:', response);
      // The handler will be overridden by the checkout initialization
      // This is just a fallback in case no custom handler is provided
    }
  };
}

/**
 * Initialize Curlec checkout with the provided options
 * @param options Checkout options
 * @returns Promise that resolves when checkout is initialized
 */
export function initializeCurlecCheckout(options: any): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Check if Razorpay is available
      if (typeof window === 'undefined' || !window.Razorpay) {
        // Load Razorpay script if not available
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        
        script.onload = () => {
          try {
            initializeRazorpayCheckout(options, resolve, reject);
          } catch (error) {
            reject(error);
          }
        };
        
        script.onerror = () => {
          reject(new Error('Failed to load payment gateway'));
        };
        
        document.body.appendChild(script);
      } else {
        // If Razorpay is already available, initialize directly
        initializeRazorpayCheckout(options, resolve, reject);
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Helper function to initialize Razorpay checkout
 * @param options Checkout options
 * @param resolve Promise resolve function
 * @param reject Promise reject function
 */
function initializeRazorpayCheckout(
  options: any,
  resolve: (value: void | PromiseLike<void>) => void,
  reject: (reason?: any) => void
): void {
  // Create a copy of options to avoid modifying the original
  const checkoutOptions = { ...options };
  
  // Setup handler function to capture payment success
  checkoutOptions.handler = function(response: any) {
    console.log('Payment successful with ID:', response.razorpay_payment_id);
    
    // Verify the payment with our server
    if (checkoutOptions.callback_url) {
      // If a callback URL is provided, the verification happens server-side
      // Just resolve the promise as the redirect will happen automatically
      resolve();
    } else {
      // If no callback URL, verify the payment through our API
      fetch('/api/curlec/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature
        }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            resolve();
          } else {
            reject(new Error(data.error || 'Payment verification failed'));
          }
        })
        .catch(error => {
          reject(error);
        });
    }
  };
  
  // Initialize Razorpay
  const rzp = new window.Razorpay(checkoutOptions);
  
  // Add modal closed event handler
  rzp.on('payment.failed', function(response: any) {
    console.error('Payment failed:', response.error);
    reject(new Error(response.error?.description || response.error?.reason || 'Payment failed'));
  });
  
  // Open the checkout
  rzp.open();
} 