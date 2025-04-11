export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  images: string[];
  image?: string;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
  weight?: number;
  weightUnit?: string;
  inventoryTracking?: boolean;
  lowStockThreshold?: number;
  stock?: number;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  product: Product;
}

export interface Address {
  id: string;
  userId: string;
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentMethod = "CREDIT_CARD" | "BANK_TRANSFER" | "E_WALLET"; 