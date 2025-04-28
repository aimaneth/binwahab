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
    const { amount, receipt, shippingAddressId, orderId } = body;

    if (!amount) {
      return NextResponse.json(
        { error: 'Amount is required' },
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
            paymentMethod: "CREDIT_CARD"
          }
        });
      } else {
        // Get user information
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          include: {
            addresses: {
              where: { isDefault: true },
              take: 1,
            },
          },
        });

        // If no shipping address provided, try to use the default address
        let addressToUse = shippingAddressId;
        
        if (!addressToUse && user?.addresses && user.addresses.length > 0) {
          addressToUse = user.addresses[0].id;
        }
        
        // If still no shipping address, return error
        if (!addressToUse) {
          return NextResponse.json(
            { error: 'Shipping address is required' },
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
            paymentMethod: "CREDIT_CARD", // Using a valid value from PaymentMethod enum
            // Store Curlec order ID in stripeSessionId field
            stripeSessionId: orderData.id,
            shippingAddressId: addressToUse
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