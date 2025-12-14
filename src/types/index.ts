// Types cho E-commerce App

export interface Variant {
  id: string;
  size: string;
  color: string;
  material: string;
  price: number;
  cost_price: number;
  quantity: number;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // Computed from variants (min price)
  originalPrice?: number;
  category: string;
  brand?: string;
  image: string;
  images?: string[];
  stock: number; // Computed from variants (total quantity)
  rating: number;
  reviews: number;
  sold_count?: number;
  tags?: string[];
  featured?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  specifications?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
  // Variants support
  variants?: Variant[];
  image_path?: string[]; // Alternative image field name
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
  variant_id?: string;
  cart_item_id?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin' | 'seller';
  addresses?: Address[];
}

export interface Address {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: Address;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserOrderCount {
  count: number;
  total_amount: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  children?: Category[];
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  body_review: string;
  createdAt: Date;
}

export interface Coupon {
  id: string;
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  minAmount?: number;
  expiresAt: Date;
  isActive: boolean;
}

// API Response Types
export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  token: string;
}

export interface LoginResponse {
  message?: string;
  email: string;
  role?: string;
  user_type?: string;
  uid?: string;
  user_id?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  access_token: string;
  refresh_token?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user: User;
  token?: string;
  refresh_token?: string;
  access_token?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
