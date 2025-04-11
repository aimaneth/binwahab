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
      where: { id: parseInt(returnItem.orderItemId) },
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
    if (!orderItem.product) {
      errors.push(`Product not found for order item ${returnItem.orderItemId}`);
      return errors;
    }

    if (!orderItem.product.isActive) {
      errors.push(`Product ${orderItem.product.name} is not active`);
    }

    // Check if return is within time limit (e.g., 30 days)
    const orderDate = new Date(order.createdAt);
    const returnDate = new Date();
    const daysSinceOrder = Math.floor((returnDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceOrder > 30) {
      errors.push("Returns must be initiated within 30 days of order date");
    }

    // Check if item was already returned
    const existingReturn = await prisma.returnItem.findFirst({
      where: {
        orderItemId: parseInt(returnItem.orderItemId),
        return: {
          status: {
            in: ["PENDING", "APPROVED"]
          }
        }
      }
    });

    if (existingReturn) {
      errors.push(`Item ${returnItem.orderItemId} has already been returned or is in the process of being returned`);
    }

    // Check if quantity is valid
    if (returnItem.quantity <= 0) {
      errors.push("Return quantity must be greater than 0");
    }

    if (returnItem.quantity > parseInt(orderItem.quantity.toString())) {
      errors.push(`Return quantity cannot exceed ordered quantity (${orderItem.quantity})`);
    }

    // Check if reason is provided
    if (!returnItem.reason) {
      errors.push("Return reason is required");
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
        where: { id: parseInt(item.orderItemId) }
      });

      if (!orderItem) continue;

      const itemTotal = Number(orderItem.price) * Number(item.quantity);
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