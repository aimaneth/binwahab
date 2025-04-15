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

export const formatPrice = (price: number, currency: string = 'MYR') => {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: currency,
  }).format(price);
};

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
  }).format(date);
}
