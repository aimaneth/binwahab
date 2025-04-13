import { Prisma } from "@prisma/client";

export type CollectionType = "MANUAL" | "AUTOMATED";
export type CollectionSortOption = "MANUAL" | "BEST_SELLING" | "TITLE_ASC" | "TITLE_DESC" | "PRICE_ASC" | "PRICE_DESC" | "CREATED_ASC" | "CREATED_DESC";
export type DisplaySection = "FEATURED" | "COMPLETE" | "NONE";

export interface Collection {
  id: string;
  name: string;
  handle: string;
  description: string | null;
  descriptionHtml: string | null;
  image: string | null;
  image2: string | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  conditions: any | null;
  isActive: boolean;
  order: number;
  sortBy: CollectionSortOption;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  ogImage: string | null;
  twitterImage: string | null;
  type: CollectionType;
  showOnHomePage: boolean;
  displaySection: DisplaySection;
}

export interface CollectionCreateInput {
  name: string;
  handle: string;
  description?: string | null;
  descriptionHtml?: string | null;
  image?: string | null;
  image2?: string | null;
  publishedAt?: Date | null;
  conditions?: any | null;
  isActive?: boolean;
  order?: number;
  sortBy?: CollectionSortOption;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  ogImage?: string | null;
  twitterImage?: string | null;
  type?: CollectionType;
  showOnHomePage?: boolean;
  displaySection?: DisplaySection;
} 