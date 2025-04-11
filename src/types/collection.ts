import { Prisma } from "@prisma/client";

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  image2?: string | null;
  type: string;
  conditions?: any | null;
  isActive: boolean;
  order: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  showOnHomePage: boolean;
  displaySection: "FEATURED" | "COMPLETE" | "NONE";
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionCreateInput {
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  image2?: string | null;
  type?: string;
  conditions?: any | null;
  isActive?: boolean;
  order?: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  showOnHomePage?: boolean;
  displaySection?: "FEATURED" | "COMPLETE" | "NONE";
}

export type CollectionType = "MANUAL" | "AUTOMATED"; 