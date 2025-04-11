import { Order, User } from "@prisma/client";
import { Resend } from 'resend';
import { ReturnWithRelations } from '../types/return';

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailNotificationService {
  static async sendReturnRequestConfirmation(
    return_: ReturnWithRelations
  ) {
    const subject = `Return Request Received - Order #${return_.orderId}`;
    const html = `
      <h1>Return Request Received</h1>
      <p>Dear ${return_.user.name},</p>
      <p>We have received your return request for Order #${return_.orderId}.</p>
      <p>Return Request Details:</p>
      <ul>
        <li>Return ID: ${return_.id}</li>
        <li>Status: ${return_.status}</li>
        <li>Reason: ${return_.reason}</li>
      </ul>
      <p>We will review your request and get back to you shortly.</p>
    `;

    await resend.emails.send({
      from: 'noreply@yourdomain.com',
      to: return_.user.email,
      subject,
      html,
    });
  }

  static async sendReturnStatusUpdate(
    return_: ReturnWithRelations
  ) {
    const subject = `Return Request Updated - Order #${return_.orderId}`;
    const html = `
      <h1>Return Request Updated</h1>
      <p>Dear ${return_.user.name},</p>
      <p>Your return request for Order #${return_.orderId} has been updated.</p>
      <p>New Status: ${return_.status}</p>
      ${return_.status === 'APPROVED' ? `
        <p>Next Steps:</p>
        <ol>
          <li>Package your items securely</li>
          <li>Include the return label in your package</li>
          <li>Drop off the package at the nearest shipping location</li>
        </ol>
      ` : ''}
      ${return_.status === 'REJECTED' ? `
        <p>Reason for rejection: ${return_.notes}</p>
        <p>If you have any questions, please contact our support team.</p>
      ` : ''}
    `;

    await resend.emails.send({
      from: 'noreply@yourdomain.com',
      to: return_.user.email,
      subject,
      html,
    });
  }

  static async sendRefundConfirmation(
    return_: ReturnWithRelations
  ) {
    if (!return_.refund) return;

    const subject = `Refund Processed - Return #${return_.id}`;
    const html = `
      <h1>Refund Processed</h1>
      <p>Dear ${return_.user.name},</p>
      <p>We have processed your refund for Return #${return_.id}.</p>
      <p>Refund Details:</p>
      <ul>
        <li>Amount: ${return_.refund.amount}</li>
        <li>Method: ${return_.refund.method}</li>
        <li>Status: ${return_.refund.status}</li>
      </ul>
      <p>The refund should appear in your account within 3-5 business days.</p>
    `;

    await resend.emails.send({
      from: 'noreply@yourdomain.com',
      to: return_.user.email,
      subject,
      html,
    });
  }

  static async sendAdminReturnNotification(
    return_: ReturnWithRelations
  ) {
    const subject = `New Return Request - Order #${return_.orderId}`;
    const html = `
      <h1>New Return Request</h1>
      <p>A new return request has been submitted.</p>
      <p>Return Details:</p>
      <ul>
        <li>Return ID: ${return_.id}</li>
        <li>Order ID: ${return_.orderId}</li>
        <li>Customer: ${return_.user.name} (${return_.user.email})</li>
        <li>Reason: ${return_.reason}</li>
        <li>Items: ${return_.returnItems.length}</li>
      </ul>
      <p>Please review this return request in the admin dashboard.</p>
    `;

    await resend.emails.send({
      from: 'noreply@yourdomain.com',
      to: process.env.ADMIN_EMAIL || 'admin@yourdomain.com',
      subject,
      html,
    });
  }
} 