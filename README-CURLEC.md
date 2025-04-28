# Curlec Payment Gateway Integration

This document explains how to set up and use the Curlec payment gateway in BINWAHAB Shop.

## Environment Variables

First, you need to set up environment variables for the Curlec integration. Add the following to your `.env` file:

```
# Curlec Variables
CURLEC_KEY_ID=yourkeyid
CURLEC_KEY_SECRET=yourkeysecret
CURLEC_WEBHOOK_SECRET=yourwebhooksecret
NEXT_PUBLIC_CURLEC_KEY_ID=publiccurleckeyid
```

## Integration Steps

The Curlec integration follows these steps:

1. **Create an Order**: On the server side, use the Curlec Orders API to create an order.
2. **Initialize Checkout**: On the client side, use the Curlec Checkout form to collect payment details.
3. **Verify Payment**: After payment, verify the signature using your server to confirm authenticity.
4. **Update Order Status**: Update the order status based on the payment result.

## Testing

To test the integration:

1. Use the Curlec test credentials.
2. Make a test payment to verify the integration works.
3. Check that webhooks are correctly handling payment events.

## Webhook Events

The integration handles the following webhook events:

- `payment.completed`: Payment was successfully completed.
- `payment.failed`: Payment attempt failed.
- `refund.processed`: A refund was processed.

## Testing FPX Payments

For testing FPX payments with Curlec:

1. Select any bank from the list in the checkout.
2. On the mock page, you can choose either `success` or `failure` for the test result.
3. Note that this will not redirect to the actual bank login in test mode.

## Implementation Details

The implementation uses:

1. **Server-side**:
   - `frontend/src/lib/curlec/server.ts` - Core server-side functions
   - `frontend/src/app/api/curlec/create-order/route.ts` - Create order endpoint
   - `frontend/src/app/api/curlec/verify-payment/route.ts` - Verify payment endpoint
   - `frontend/src/app/api/webhooks/curlec/route.ts` - Webhook handler

2. **Client-side**:
   - `frontend/src/lib/curlec/client.ts` - Client utilities
   - `frontend/src/components/shop/curlec-payment-button.tsx` - Payment button component
   - `frontend/src/app/(shop)/shop/checkout/curlec/page.tsx` - Checkout page

## Go-Live Checklist

Before going live:

1. Replace test credentials with production credentials.
2. Make sure webhook URLs are properly configured in your Curlec dashboard.
3. Set up proper error handling and notifications for payment issues.
4. Test the entire payment flow end-to-end.

## Troubleshooting

Common issues:

1. **Missing Environment Variables**: Ensure all required environment variables are set.
2. **Payment Verification Fails**: Check that you're using the correct key for signature verification.
3. **Webhook Issues**: Verify that the webhook URLs are accessible from Curlec servers.

For more information, refer to the [official Curlec documentation](https://curlec.com/docs/). 