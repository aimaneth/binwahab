import { Decimal } from "@prisma/client/runtime/library";

export type ProductStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";

export interface ProductImage {
  id: number;
  url: string;
  order: number;
  productId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  isActive: boolean;
  parentId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  createdAt: Date;
  updatedAt: Date;
  order: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  image: string | null;
  price: Decimal;
  stock: number;
  reservedStock: number;
  slug: string | null;
  isActive: boolean;
  status: ProductStatus;
  categoryId: string | null;
  createdAt: Date;
  updatedAt: Date;
  images: ProductImage[];
  category: Category | null;
  sku: string | null;
  inventoryTracking: boolean;
  lowStockThreshold: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  } | null;
  weight?: number | null;
}

export interface ProductCreateInput {
  name: string;
  description: string;
  image?: string | null;
  price: number;
  stock?: number;
  slug?: string | null;
  isActive?: boolean;
  status?: ProductStatus;
  categoryId?: string | null;
  images?: { url: string; order: number }[];
} 