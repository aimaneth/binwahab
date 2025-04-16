import { Prisma } from "@prisma/client";

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
  descriptionHtml: string | null;
  handle?: string | null;
  price: string;
  stock: number;
  reservedStock: number;
  slug: string | null;
  isActive: boolean;
  status: ProductStatus;
  image: string | null;
  sku: string | null;
  inventoryTracking: boolean;
  lowStockThreshold: number;
  images: ProductImage[];
  variants: ProductVariant[];
  category: Category | null;
  categoryId: string | null;
  createdAt: Date;
  updatedAt: Date;
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

export type ProductVariant = {
  id: number;
  name: string;
  sku: string;
  price: string;
  compareAtPrice?: string | null;
  stock: number;
  reservedStock: number;
  options: Record<string, string>;
  images: string[];
  inventoryTracking: boolean;
  lowStockThreshold: number | null;
  productId: number;
  isActive: boolean;
  barcode?: string | null;
  weight?: string | null;
  weightUnit?: string | null;
  dimensions?: Record<string, any> | null;
};

export type ProductMetafield = {
  id: string;
  namespace: string;
  key: string;
  value: string;
  type: string;
}; 