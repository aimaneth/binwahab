import { Product, ProductVariant } from "@prisma/client";

export interface CartItem {
  id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: string | number; // Match Prisma Decimal
    image?: string;
    images?: Array<{ url: string }>;
    description?: string;
  };
  variant?: {
    id: number;
    sku: string;
    price: string | number; // Match Prisma Decimal
    name: string;
    image?: string;
    options?: Record<string, string>; // Add options field
  };
} 