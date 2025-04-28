# Curlec Integration

This directory contains utilities for integrating with the Curlec payment gateway.

## Required Environment Variables

Add these to your `.env.local` file:

```
# Curlec Integration
CURLEC_KEY_ID=your_curlec_key_id_here
CURLEC_KEY_SECRET=your_curlec_key_secret_here
CURLEC_WEBHOOK_SECRET=your_curlec_webhook_secret_here

# Add this URL to your Curlec dashboard's webhook settings
WEBHOOK_URL=https://your-domain.com/api/webhooks/curlec
```

## API Endpoints

The following API endpoints are available for Curlec integration:

1. `/api/curlec/create-order`: Creates a new Curlec order
2. `/api/curlec/verify-payment`: Verifies a payment after it's completed
3. `/api/curlec/get-key`: Securely provides the Curlec key to the client
4. `/api/webhooks/curlec`: Webhook endpoint for receiving payment notifications

## Client-Side Usage

To use Curlec on the client side, first fetch the key from the `get-key` endpoint, then use it to initialize the Curlec SDK. 