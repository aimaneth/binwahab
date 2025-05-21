import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import Razorpay from 'razorpay';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.CURLEC_KEY_ID || '',
  key_secret: process.env.CURLEC_KEY_SECRET || '',
});

export async function POST(request: Request) {
  try {
    // Check user session first
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { amount, receipt, shippingAddressId, orderId, paymentMethod } = body;

    console.log('Curlec create-order request:', { amount, shippingAddressId, orderId });

    if (!amount) {
      return NextResponse.json(
        { error: 'Amount is required' },
        { status: 400 }
      );
    }

    // Validate shippingAddressId is provided when creating a new order
    if (!orderId && !shippingAddressId) {
      console.error('Shipping address is required for new orders');
      return NextResponse.json(
        { error: 'Shipping address is required' },
        { status: 400 }
      );
    }

    // Format amount (should be in sen, e.g., RM 10.00 = 1000 sen)
    const formattedAmount = Math.round(parseFloat(amount) * 100);

    // Create the order with Curlec using the SDK
    try {
      // Define notes with user info if available
      const notes: Record<string, string> = {
        source: 'BINWAHAB Shop'
      };
      
      // Add user information to notes if available
      if (session.user.email) {
        notes.customerEmail = session.user.email;
      }
      
      if (session.user.name) {
        notes.customerName = session.user.name;
      }
      
      // Add payment method to notes for better tracking
      if (paymentMethod) {
        notes.paymentMethod = paymentMethod;
      }
      
      // Create Razorpay order
      const orderData = await razorpay.orders.create({
        amount: formattedAmount,
        currency: 'MYR',
        receipt: receipt || `order_${Date.now()}`,
        notes
      });

      // If an existing order ID is provided, use that instead of creating a new one
      let order;
      
      if (orderId) {
        // Check if the order exists and belongs to the user
        const existingOrder = await prisma.order.findUnique({
          where: {
            id: orderId,
            userId: session.user.id
          }
        });
        
        if (!existingOrder) {
          return NextResponse.json(
            { error: 'Order not found' },
            { status: 404 }
          );
        }
        
        // Update the existing order with the Curlec order ID
        order = await prisma.order.update({
          where: { id: orderId },
          data: {
            stripeSessionId: orderData.id,
            paymentStatus: "PENDING",
            paymentMethod: paymentMethod || "CREDIT_CARD"
          }
        });
      } else {
        // Explicitly check if shippingAddressId exists and is valid
        if (!shippingAddressId) {
          console.error('Missing shipping address ID for new order');
          return NextResponse.json(
            { error: 'Shipping address is required' },
            { status: 400 }
          );
        }

        // Verify the shipping address exists and belongs to the user
        const address = await prisma.address.findUnique({
          where: {
            id: shippingAddressId,
            userId: session.user.id
          }
        });

        if (!address) {
          console.error('Invalid shipping address provided:', shippingAddressId);
          return NextResponse.json(
            { error: 'Invalid shipping address' },
            { status: 400 }
          );
        }

        // Create new order with Curlec order ID
        order = await prisma.order.create({
          data: {
            userId: session.user.id,
            total: parseFloat(amount),
            status: "PENDING",
            paymentStatus: "PENDING",
            paymentMethod: paymentMethod || "CREDIT_CARD",
            // Store Curlec order ID in stripeSessionId field
            stripeSessionId: orderData.id,
            shippingAddressId: shippingAddressId
          }
        });
      }

      // Return the order details needed for client-side checkout
      return NextResponse.json({
        id: orderData.id,
        amount: formattedAmount,
        currency: orderData.currency,
        order_id: order.id,
        customer_email: session.user.email || '',
        customer_name: session.user.name || ''
      });
    } catch (error: any) {
      console.error('Error creating Curlec order:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create order' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in create order API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 