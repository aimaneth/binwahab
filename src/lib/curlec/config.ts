/**
 * Configuration for Curlec integration
 */

/**
 * Environment variables - these should be set in your .env file
 * or environment configuration depending on deployment
 */
export const CURLEC_CLIENT_ID = process.env.CURLEC_CLIENT_ID || '';
export const CURLEC_CLIENT_SECRET = process.env.CURLEC_CLIENT_SECRET || '';
export const CURLEC_MERCHANT_CODE = process.env.CURLEC_MERCHANT_CODE || '';
export const CURLEC_WEBHOOK_SECRET = process.env.CURLEC_WEBHOOK_SECRET || CURLEC_CLIENT_SECRET;

/**
 * API base URLs for different environments
 */
const API_URLS = {
  production: 'https://api.curlec.com/v1',
  sandbox: 'https://api-sandbox.curlec.com/v1',
  development: 'https://api-sandbox.curlec.com/v1',
};

// Legacy API URLs
export const CURLEC_API_SANDBOX_URL = 'https://staging.curlec.com.my/API/v1';
export const CURLEC_API_PRODUCTION_URL = 'https://secure.curlec.com.my/API/v1';

/**
 * Determine which API environment to use
 * Defaults to sandbox in development environments
 */
export const CURLEC_ENVIRONMENT = 
  (process.env.CURLEC_ENVIRONMENT || process.env.NODE_ENV || 'development') as keyof typeof API_URLS;

/**
 * Get the base API URL based on the current environment
 */
export const CURLEC_API_BASE_URL = process.env.NEXT_PUBLIC_CURLEC_API_URL || API_URLS[CURLEC_ENVIRONMENT] || API_URLS.sandbox;

/**
 * New checkout URL for the widget
 */
export const CURLEC_CHECKOUT_URL = process.env.NEXT_PUBLIC_CURLEC_CHECKOUT_URL || 'https://sandbox.curlec.com/checkout';

/**
 * API request timeout in milliseconds
 */
export const CURLEC_API_TIMEOUT = 30000; // 30 seconds

/**
 * API version
 */
export const CURLEC_API_VERSION = 'v1';

/**
 * Default currency
 */
export const CURLEC_DEFAULT_CURRENCY = 'MYR';

/**
 * Curlec SDK URL for client-side integration
 */
export const CURLEC_SDK_URL = 'https://sandbox.curlec.com/widget/js/curlec-widget.js';

/**
 * Check if Curlec credentials are configured
 * @returns true if credentials are configured
 */
export function isCurlecConfigured(): boolean {
  return Boolean(CURLEC_CLIENT_ID && CURLEC_CLIENT_SECRET && CURLEC_MERCHANT_CODE);
}

/**
 * Get the full Curlec API URL 
 * Can be used in two ways:
 * 1. getCurlecApiUrl() - returns the base API URL based on environment
 * 2. getCurlecApiUrl(endpoint) - returns the full API URL with endpoint appended
 * 
 * @param endpoint - Optional API endpoint to append
 * @returns The API URL
 */
export function getCurlecApiUrl(endpoint?: string): string {
  // If an explicit URL is provided in environment variables, use that
  if (process.env.CURLEC_API_URL) {
    return endpoint 
      ? `${process.env.CURLEC_API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
      : process.env.CURLEC_API_URL;
  }
  
  // If no endpoint provided, return the base URL based on environment
  if (!endpoint) {
    const isProduction = process.env.NODE_ENV === 'production';
    return isProduction ? CURLEC_API_PRODUCTION_URL : CURLEC_API_SANDBOX_URL;
  }
  
  // If endpoint is provided, append it to the base URL
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${CURLEC_API_BASE_URL}${path}`;
}

/**
 * Common payment statuses returned by Curlec API
 */
export enum CurlecPaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

/**
 * Webhook event types
 */
export enum CurlecWebhookEvent {
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_EXPIRED = 'payment.expired',
  PAYMENT_CANCELLED = 'payment.cancelled',
  REFUND_COMPLETED = 'refund.completed',
  REFUND_FAILED = 'refund.failed',
}

/**
 * Curlec API Payment Status enum
 */
export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  REFUNDED = 'REFUNDED',
  PARTIAL_REFUND = 'PARTIAL_REFUND'
}

/**
 * Curlec API Currency options
 */
export enum Currency {
  MYR = 'MYR',
}

/**
 * Curlec API Payment Method options
 */
export enum PaymentMethod {
  FPX = 'FPX',
  DIRECT_DEBIT = 'DIRECT_DEBIT',
  CREDIT_CARD = 'CREDIT_CARD',
}

/**
 * Webhook event types as constants
 */
export const CURLEC_EVENT_TYPES = {
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED: 'payment.failed',
  REFUND_COMPLETED: 'refund.completed',
  REFUND_FAILED: 'refund.failed',
} as const;

/**
 * API endpoints
 */
export const CURLEC_ENDPOINTS = {
  CREATE_ORDER: '/orders',
  VERIFY_PAYMENT: '/payments/verify',
  PAYMENT_STATUS: '/payments',
} as const;

/**
 * Response status codes
 */
export const CURLEC_STATUS = {
  SUCCESS: 'success',
  PENDING: 'pending',
  FAILED: 'failed',
} as const;

/**
 * Curlec payment methods
 */
export const CURLEC_PAYMENT_METHODS = {
  FPX: 'fpx',
  CARD: 'card',
  DIRECT_DEBIT: 'direct_debit',
} as const;

/**
 * Curlec client options
 */
export interface CurlecClientOptions {
  apiUrl?: string;
  clientId?: string;
  clientSecret?: string;
  webhookSecret?: string;
  currency?: string;
  timeout?: number;
}

/**
 * Get client configuration with defaults
 */
export function getClientConfig(options?: CurlecClientOptions) {
  return {
    apiUrl: options?.apiUrl || CURLEC_API_BASE_URL,
    clientId: options?.clientId || CURLEC_CLIENT_ID,
    clientSecret: options?.clientSecret || CURLEC_CLIENT_SECRET,
    webhookSecret: options?.webhookSecret || CURLEC_WEBHOOK_SECRET,
    currency: options?.currency || CURLEC_DEFAULT_CURRENCY,
    timeout: options?.timeout || CURLEC_API_TIMEOUT,
  };
}

// Export default config object
export default {
  clientId: CURLEC_CLIENT_ID,
  clientSecret: CURLEC_CLIENT_SECRET,
  merchantCode: CURLEC_MERCHANT_CODE,
  apiTimeout: CURLEC_API_TIMEOUT,
  getCurlecApiUrl,
  PaymentStatus,
  Currency,
  PaymentMethod,
  CURLEC_EVENT_TYPES,
  CURLEC_ENDPOINTS,
  CURLEC_STATUS,
  CURLEC_PAYMENT_METHODS,
}; 