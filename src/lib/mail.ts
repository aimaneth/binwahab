import nodemailer from 'nodemailer';
import { OrderStatus } from '@prisma/client';
import { formatPrice } from "@/utils/format";

interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
}

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface OrderStatusEmailProps {
  orderId: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  shippingAddress: ShippingAddress;
  customerEmail: string;
  customerName: string;
}

const statusMessages: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Your order has been received and is pending confirmation.',
  [OrderStatus.PROCESSING]: 'Your order is being processed and will be shipped soon.',
  [OrderStatus.SHIPPED]: 'Your order has been shipped and is on its way!',
  [OrderStatus.DELIVERED]: 'Your order has been delivered successfully.',
  [OrderStatus.CANCELLED]: 'Your order has been cancelled.'
};

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendOrderStatusEmail({
  orderId,
  status,
  items,
  total,
  shippingAddress,
  customerEmail,
  customerName,
}: OrderStatusEmailProps) {
  const statusMessage = statusMessages[status];
  
  const itemsList = items
    .map(item => `${item.productName} x ${item.quantity} - ${formatPrice(item.price)}`)
    .join('\n');

  const shippingAddressFormatted = `${shippingAddress.street}\n${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}\n${shippingAddress.country}`;

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: customerEmail,
    subject: `Order #${orderId} Status Update`,
    text: `Dear ${customerName},\n\n${statusMessage}\n\nOrder Details:\n${itemsList}\n\nTotal: ${formatPrice(total)}\n\nShipping Address:\n${shippingAddressFormatted}\n\nThank you for shopping with us!\n\nBest regards,\nYour Store Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Order Status Update</h2>
        <p>Dear ${customerName},</p>
        <p>${statusMessage}</p>
        
        <h3>Order Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Item</th>
              <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.productName} x ${item.quantity}</td>
                <td style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">${formatPrice(item.price)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Total</td>
              <td style="text-align: right; padding: 8px; font-weight: bold;">${formatPrice(total)}</td>
            </tr>
          </tfoot>
        </table>

        <h3>Shipping Address</h3>
        <p style="white-space: pre-line;">${shippingAddressFormatted}</p>

        <p>Thank you for shopping with us!</p>
        <p>Best regards,<br>Your Store Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Failed to send order status email:', error);
    throw new Error('Failed to send order status email');
  }
} 