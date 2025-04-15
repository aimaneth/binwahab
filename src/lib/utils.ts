import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Decimal } from "@prisma/client/runtime/library"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Type guard for Decimal-like objects
function isDecimal(value: any): boolean {
  return value && typeof value === 'object' && 'toNumber' in value;
}

export function formatPrice(price: number | string | { toString: () => string }) {
  // Handle various price types
  const numericPrice = typeof price === 'number' 
    ? price 
    : typeof price === 'string' 
      ? parseFloat(price)
      : parseFloat(price.toString());

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
