import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Type guard for Decimal-like objects
function isDecimal(value: any): boolean {
  return value && typeof value === 'object' && 'toNumber' in value;
}

export function formatPrice(price: number | any) {
  const numericPrice = isDecimal(price) ? price.toNumber() : price;
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
  }).format(numericPrice);
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString();
}

export function formatCurrency(amount: number | string | any): string {
  let numericAmount: number;
  
  if (typeof amount === 'string') {
    numericAmount = parseFloat(amount);
  } else if (isDecimal(amount)) {
    numericAmount = amount.toNumber();
  } else {
    numericAmount = amount;
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(numericAmount);
} 