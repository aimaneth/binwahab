import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Decimal } from "@prisma/client/runtime/library"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface DecimalLike {
  toNumber: () => number;
}

function isDecimal(value: any): value is DecimalLike {
  return typeof value === 'object' && value !== null && typeof value.toNumber === 'function';
}

export function formatPrice(price: number | string | DecimalLike | { toString: () => string }) {
  if (!price) return 'RM0.00';

  // Handle Decimal objects from Prisma
  if (isDecimal(price)) {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2,
    }).format(price.toNumber());
  }

  // Handle string prices
  if (typeof price === 'string') {
    // Remove any non-numeric characters except decimal point
    const cleanPrice = price.replace(/[^0-9.]/g, '');
    const numericPrice = parseFloat(cleanPrice);
    
    if (isNaN(numericPrice)) return 'RM0.00';
    
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2,
    }).format(numericPrice);
  }

  // Handle numeric prices
  const numericPrice = typeof price === 'number' ? price : parseFloat(price.toString());
  
  if (isNaN(numericPrice)) return 'RM0.00';

  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
  }).format(numericPrice);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
  }).format(date);
}

export function formatOrderId(orderId: string) {
  // If it's already in the new format (BW-YYYY-NNNN), return as is
  if (orderId.startsWith('BW-')) {
    return orderId;
  }
  // For old format IDs, just show the last 8 characters
  return `#${orderId.slice(-8)}`;
}
