import { Product, ProductVariant } from "@prisma/client";

export interface OrderItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: string;
    image?: string;
  };
  variant?: {
    id: string;
    name: string;
    price: string;
    sku: string;
  };
} 