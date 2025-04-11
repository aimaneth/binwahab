import { Decimal } from "@prisma/client/runtime/library";

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