import { Order, User, PaymentStatus } from '@prisma/client';

export type ReturnStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";

export type RefundMethod = "CREDIT_CARD" | "PAYPAL" | "STORE_CREDIT";

export interface ReturnItemData {
  orderItemId: string;
  quantity: number;
  reason: string;
  condition: string;
  photos?: string[];
}

export interface RefundCalculation {
  subtotal: number;
  shippingCost: number;
  restockingFee: number;
  total: number;
}

export interface ReturnWithRelations {
  id: string;
  orderId: string;
  userId: string;
  reason: string;
  notes?: string | null;
  status: ReturnStatus;
  createdAt: Date;
  updatedAt: Date;
  returnItems: Array<{
    id: string;
    returnId: string;
    orderItemId: string;
    productId: string;
    variantId?: string | null;
    quantity: number;
    reason: string;
    condition: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  order: Order;
  user: User;
  refund?: {
    id: string;
    returnId: string;
    amount: number;
    method: string;
    status: PaymentStatus;
    createdAt: Date;
    updatedAt: Date;
  } | null;
} 