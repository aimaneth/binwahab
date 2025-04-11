import { RETURN_POLICY, RETURN_VALIDATION_RULES, REFUND_CALCULATION_RULES } from '../constants/return-policy';
import { prisma } from '@/lib/prisma';
import { Order, OrderItem, Product } from '@prisma/client';
import { ReturnItemData, RefundCalculation, ReturnStatus } from '../types/return';

export interface ReturnValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ReturnValidationService {
  static async validateReturnEligibility(order: Order, items: ReturnItemData[]): Promise<ReturnValidationResult> {
    const errors: string[] = [];

    // Check return window
    const returnDeadline = new Date(order.createdAt);
    returnDeadline.setDate(returnDeadline.getDate() + RETURN_POLICY.WINDOW_DAYS);
    if (new Date() > returnDeadline) {
      errors.push(`Return window of ${RETURN_POLICY.WINDOW_DAYS} days has expired`);
    }

    // Check order status
    if (order.status !== "DELIVERED") {
      errors.push("Order must be delivered before initiating return");
    }

    // Check number of items
    if (items.length > RETURN_VALIDATION_RULES.MAX_ITEMS_PER_RETURN) {
      errors.push(`Cannot return more than ${RETURN_VALIDATION_RULES.MAX_ITEMS_PER_RETURN} items in one request`);
    }

    // Validate each item
    for (const item of items) {
      const itemErrors = await this.validateReturnItem(order, item);
      errors.push(...itemErrors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static async validateReturnItem(order: Order, returnItem: ReturnItemData): Promise<string[]> {
    const errors: string[] = [];

    // Find original order item
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: returnItem.orderItemId },
      include: { product: true }
    });

    if (!orderItem) {
      errors.push(`Order item ${returnItem.orderItemId} not found`);
      return errors;
    }

    // Check quantity
    if (returnItem.quantity > orderItem.quantity) {
      errors.push(`Return quantity cannot exceed ordered quantity (${orderItem.quantity})`);
    }

    // Check if product is returnable
    if (RETURN_VALIDATION_RULES.RESTRICTED_ITEMS.some(tag => orderItem.product.tags.includes(tag))) {
      errors.push(`Product ${orderItem.product.name} cannot be returned`);
    }

    // Validate reason length
    if (!returnItem.reason || returnItem.reason.length < RETURN_VALIDATION_RULES.MIN_REASON_LENGTH) {
      errors.push(`Return reason must be at least ${RETURN_VALIDATION_RULES.MIN_REASON_LENGTH} characters`);
    }

    // Validate condition requirements
    if (RETURN_VALIDATION_RULES.CONDITION_REQUIREMENTS.PHOTOS_REQUIRED && !returnItem.photos) {
      errors.push("Photos of the item are required");
    }

    return errors;
  }

  static async calculateRefundAmount(order: Order, returnItems: ReturnItemData[]): Promise<RefundCalculation> {
    let refundAmount = 0;
    let shippingRefund = 0;
    let restockingFee = 0;

    // Calculate item refunds
    for (const item of returnItems) {
      const orderItem = await prisma.orderItem.findUnique({
        where: { id: item.orderItemId }
      });

      if (!orderItem) continue;

      const itemTotal = orderItem.price * item.quantity;
      const itemRestockingFee = this.calculateRestockingFee(item.condition, itemTotal);
      
      refundAmount += itemTotal;
      restockingFee += itemRestockingFee;
    }

    // Calculate shipping refund
    if (returnItems.some(item => item.reason === "DEFECTIVE" || item.reason === "WRONG_ITEM")) {
      shippingRefund = order.total * 0.1; // Assuming shipping is 10% of order total
    }

    // Calculate final refund amount
    const finalRefundAmount = refundAmount + shippingRefund - restockingFee;

    return {
      subtotal: refundAmount,
      shippingCost: shippingRefund,
      restockingFee,
      total: finalRefundAmount
    };
  }

  private static calculateRestockingFee(condition: string, amount: number): number {
    const fee = REFUND_CALCULATION_RULES.RESTOCKING_FEE[condition as keyof typeof REFUND_CALCULATION_RULES.RESTOCKING_FEE];
    if (fee === "CASE_BY_CASE") return 0; // Handle manually
    const numericFee = typeof fee === 'number' ? fee : 0;
    return (numericFee / 100) * amount;
  }
} 