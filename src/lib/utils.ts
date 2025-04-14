import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Decimal } from "@prisma/client/runtime/library"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Type guard for Decimal-like objects
function isDecimal(value: any): boolean {
  return value && typeof value === 'object' && 'toNumber' in value;
}

export function formatPrice(price: number | Decimal): string {
  const numericPrice: number = isDecimal(price) ? (price as Decimal).toNumber() : (price as number);
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
  }).format(numericPrice);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
  }).format(date);
}
