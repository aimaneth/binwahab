import { Prisma } from "@prisma/client";

export type ProductStatus = "ACTIVE" | "DRAFT" | "ARCHIVED" | "HIDDEN" | "SCHEDULED";

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
  description?: string;
  image?: string;
  isActive: boolean;
  parentId?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  createdAt: Date;
  updatedAt: Date;
  order: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  descriptionHtml?: string;
  handle: string;
  price: Prisma.Decimal;
  compareAtPrice?: Prisma.Decimal;
  costPerItem?: Prisma.Decimal;
  stock: number;
  reservedStock: number;
  slug?: string;
  isActive: boolean;
  status: ProductStatus;
  image?: string;
  sku?: string;
  barcode?: string;
  inventoryTracking: boolean;
  inventoryPolicy: "DENY" | "CONTINUE";
  allowBackorder: boolean;
  lowStockThreshold: number;
  taxable: boolean;
  taxCode?: string;
  weight?: number;
  weightUnit?: string;
  requiresShipping: boolean;
  shippingProfile?: string;
  fulfillmentService?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogImage?: string;
  twitterImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  vendor?: string;
  type?: string;
  tags: string[];
  images: ProductImage[];
  variants: ProductVariant[];
  options?: Prisma.JsonValue;
  category?: Category;
  metafields: ProductMetafield[];
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
  price: Prisma.Decimal;
  compareAtPrice?: Prisma.Decimal;
  costPerItem?: Prisma.Decimal;
  stock: number;
  reservedStock: number;
  options: Prisma.JsonValue;
  images: string[];
};

export type ProductMetafield = {
  id: string;
  namespace: string;
  key: string;
  value: string;
  type: string;
}; 