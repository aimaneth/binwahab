import { Prisma, CollectionType, DisplaySection, CollectionSortOption } from "@prisma/client";

export { CollectionType, DisplaySection, CollectionSortOption };

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
  handle?: string;
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