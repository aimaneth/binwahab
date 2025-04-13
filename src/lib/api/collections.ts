import { Collection } from '@/types/collection';

interface CollectionData {
  name: string;
  description: string;
  descriptionHtml?: string;
  image?: string;
  image2?: string;
  type: string;
  conditions: string;
  isActive: boolean;
  showOnHomePage: boolean;
  displaySection: "FEATURED" | "COMPLETE" | "NONE";
  sortBy?: "MANUAL" | "BEST_SELLING" | "TITLE_ASC" | "TITLE_DESC" | "PRICE_ASC" | "PRICE_DESC" | "CREATED_ASC" | "CREATED_DESC";
}

export async function createCollection(data: CollectionData): Promise<Collection> {
  const response = await fetch('/api/collections', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...data,
      sortBy: data.sortBy || "MANUAL"
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create collection');
  }

  return response.json();
}

export async function updateCollection(id: string, data: CollectionData): Promise<Collection> {
  const response = await fetch(`/api/collections/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...data,
      sortBy: data.sortBy || "MANUAL"
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to update collection');
  }

  return response.json();
} 