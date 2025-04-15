import { Product, ProductVariant } from "@prisma/client";

export interface CartItem {
  id: number;
  quantity: number;
  product: Product;
  variant?: ProductVariant | null;
} 