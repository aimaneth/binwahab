import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Decimal } from "@prisma/client/runtime/library";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
  }).format(price);
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString();
}

export function formatCurrency(amount: number | string | Decimal): string {
  const numericAmount = typeof amount === 'string' 
    ? parseFloat(amount) 
    : amount instanceof Decimal 
      ? amount.toNumber() 
      : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(numericAmount);
} 