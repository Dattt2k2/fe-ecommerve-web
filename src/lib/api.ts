// API configuration
import { LoginResponse, RegisterResponse, User, Product, Order } from '@/types';

// Force use internal API for now - remove this line to use external API
const FORCE_INTERNAL_API = false;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Debug logging
console.log('🔍 API Configuration Debug:');
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('API_BASE_URL:', API_BASE_URL);
console.log('FORCE_INTERNAL_API:', FORCE_INTERNAL_API);

// Fallback to internal Next.js API routes if external API is not available
const USE_INTERNAL_API = FORCE_INTERNAL_API || !process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL.trim() === '';
console.log('USE_INTERNAL_API:', USE_INTERNAL_API);

// API endpoints - sử dụng Next.js internal API routes khi không có external API
export const API_ENDPOINTS = {
  AUTH: {
    // Always target the gateway `/api` routes so frontend calls go to the API gateway
    LOGIN: '/auth/users/login',
    REGISTER: '/auth/users/register',
    LOGOUT: '/auth/users/logout',
    REFRESH: '/auth/users/refresh',
    PROFILE: '/auth/users/profile',
  },  PRODUCTS: {
    LIST: USE_INTERNAL_API ? '/api/products' : '/api/products',
    DETAIL: (id: string) => USE_INTERNAL_API ? `/api/products/${id}` : `/api/products/${id}`,
    CREATE: USE_INTERNAL_API ? '/api/products' : '/api/products',
    UPDATE: (id: string) => USE_INTERNAL_API ? `/api/products/${id}` : `/api/products/${id}`,
    DELETE: (id: string) => USE_INTERNAL_API ? `/api/products/${id}` : `/api/products/${id}`,
    SEARCH: USE_INTERNAL_API ? '/api/products/search' : '/api/products/search',
    CATEGORIES: USE_INTERNAL_API ? '/api/products/categories' : '/api/products/categories',
  },
  ORDERS: {
    LIST: USE_INTERNAL_API ? '/api/orders' : '/api/orders',
    DETAIL: (id: string) => USE_INTERNAL_API ? `/api/orders/${id}` : `/api/orders/${id}`,
    CREATE: USE_INTERNAL_API ? '/api/orders' : '/api/orders',
    UPDATE: (id: string) => USE_INTERNAL_API ? `/api/orders/${id}` : `/api/orders/${id}`,
    USER_ORDERS: (userId: string) => USE_INTERNAL_API ? `/api/orders/user/${userId}` : `/api/orders/user/${userId}`,
  },
  USERS: {
    LIST: USE_INTERNAL_API ? '/api/users' : '/api/users',
    DETAIL: (id: string) => USE_INTERNAL_API ? `/api/users/${id}` : `/api/users/${id}`,
    UPDATE: (id: string) => USE_INTERNAL_API ? `/api/users/${id}` : `/api/users/${id}`,
    DELETE: (id: string) => USE_INTERNAL_API ? `/api/users/${id}` : `/api/users/${id}`,
  },
  ADMIN: {
    DASHBOARD: USE_INTERNAL_API ? '/api/admin/dashboard' : '/api/admin/dashboard',
    ANALYTICS: USE_INTERNAL_API ? '/api/admin/analytics' : '/api/admin/analytics',
    CUSTOMERS: USE_INTERNAL_API ? '/api/admin/customers' : '/api/admin/customers',
  }
};

// API client with interceptors
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    // For internal API routes, use relative URLs (no baseURL)
    // For external API, build the full URL safely (handle trailing/leading slashes)
    const buildUrl = (base: string, ep: string) => {
      if (!base) return ep;
      const b = base.endsWith('/') ? base.slice(0, -1) : base;
      const e = ep.startsWith('/') ? ep : `/${ep}`;
      return `${b}${e}`;
    };

    const url = USE_INTERNAL_API ? endpoint : buildUrl(this.baseURL, endpoint);

    console.log(`API Request: ${USE_INTERNAL_API ? 'Internal' : 'External'} - ${url}`);
    
    // Get token from localStorage or cookies
    const token = this.getToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      console.log(`API Response: ${response.status} ${response.statusText} - ${url}`);
      
      // Handle authentication errors
      if (response.status === 401) {
        this.handleAuthError();
        const errorData = await response.json().catch(() => ({}));
        const errPayload = { status: response.status, url, data: errorData };
        console.error('401 Error details:', errPayload);
        throw new Error(JSON.stringify(errPayload));
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errPayload = { status: response.status, url, data: errorData };
        console.error(`${response.status} Error details:`, errPayload);
        throw new Error(JSON.stringify(errPayload));
      }

      const responseData = await response.json().catch(() => ({}));
      console.log('API Response data:', responseData);
      return responseData;
    } catch (error: any) {
      const payload = {
        url,
        method: config.method || 'GET',
        message: error?.message ?? String(error),
        name: error?.name,
        stack: error?.stack,
      };
      console.error('API request failed:', payload);

      // If external API fails and we're in development, suggest using internal API
      if (error && error.name === 'TypeError' && String(error.message).toLowerCase().includes('fetch')) {
        console.warn('External API not reachable. Consider using internal Next.js API routes.');
        console.log('To use internal API, remove NEXT_PUBLIC_API_URL from .env.local');
      }

      // Re-throw with structured JSON so callers can inspect details
      throw new Error(JSON.stringify(payload));
    }
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }
    return null;
  }

  private handleAuthError() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('auth_token');
      // Redirect to login page
      window.location.href = '/auth/login';
    }
  }

  // HTTP methods
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Upload files
  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const token = this.getToken();
    
    const config: RequestInit = {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    };

    // Use internal relative endpoint when configured, otherwise full external URL
    const buildUrl = (base: string, ep: string) => {
      if (!base) return ep;
      const b = base.endsWith('/') ? base.slice(0, -1) : base;
      const e = ep.startsWith('/') ? ep : `/${ep}`;
      return `${b}${e}`;
    };

    const url = USE_INTERNAL_API ? endpoint : buildUrl(this.baseURL, endpoint);
    const response = await fetch(url, { ...config, credentials: 'include' });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    return await response.json();
  }
}

// Export API client instance
// Create API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export configuration for debugging
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  USE_INTERNAL_API,
  ENDPOINTS: API_ENDPOINTS
};

// Helper functions for common API calls
export const authAPI = {
  login: (email: string, password: string): Promise<LoginResponse> => 
    apiClient.post(API_ENDPOINTS.AUTH.LOGIN, { email, password }),
  
  register: (userData: { email: string; password: string; name: string; confirmPassword?: string }): Promise<RegisterResponse> => 
    apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData),
  
  logout: (): Promise<{ message: string }> => 
    apiClient.post(API_ENDPOINTS.AUTH.LOGOUT),
  
  getProfile: (): Promise<{ user: User }> => 
    apiClient.get(API_ENDPOINTS.AUTH.PROFILE),
  
  refreshToken: (): Promise<LoginResponse> => 
    apiClient.post(API_ENDPOINTS.AUTH.REFRESH),
};

export const productsAPI = {
  getProducts: (params?: Record<string, string>): Promise<{ products: Product[]; pagination: any }> => 
    apiClient.get(`${API_ENDPOINTS.PRODUCTS.LIST}${params ? `?${new URLSearchParams(params)}` : ''}`),
  
  getProduct: (id: string): Promise<{ product: Product }> => 
    apiClient.get(API_ENDPOINTS.PRODUCTS.DETAIL(id)),
  
  createProduct: (productData: Partial<Product>): Promise<{ message: string; product: Product }> => 
    apiClient.post(API_ENDPOINTS.PRODUCTS.CREATE, productData),
  
  updateProduct: (id: string, productData: Partial<Product>): Promise<{ message: string; product: Product }> => 
    apiClient.put(API_ENDPOINTS.PRODUCTS.UPDATE(id), productData),
  
  deleteProduct: (id: string): Promise<{ message: string }> => 
    apiClient.delete(API_ENDPOINTS.PRODUCTS.DELETE(id)),
  
  searchProducts: (query: string, filters?: Record<string, string>): Promise<{ products: Product[] }> => 
    apiClient.get(`${API_ENDPOINTS.PRODUCTS.SEARCH}?q=${query}${filters ? `&${new URLSearchParams(filters)}` : ''}`),
  
  getCategories: (): Promise<{ categories: string[] }> => 
    apiClient.get(API_ENDPOINTS.PRODUCTS.CATEGORIES),
};

export const ordersAPI = {
  getOrders: (params?: Record<string, string>): Promise<{ orders: Order[]; pagination: any }> => 
    apiClient.get(`${API_ENDPOINTS.ORDERS.LIST}${params ? `?${new URLSearchParams(params)}` : ''}`),
  
  getOrder: (id: string): Promise<{ order: Order }> => 
    apiClient.get(API_ENDPOINTS.ORDERS.DETAIL(id)),
  
  createOrder: (orderData: Partial<Order>): Promise<{ message: string; order: Order }> => 
    apiClient.post(API_ENDPOINTS.ORDERS.CREATE, orderData),
  
  updateOrder: (id: string, orderData: Partial<Order>): Promise<{ message: string; order: Order }> => 
    apiClient.put(API_ENDPOINTS.ORDERS.UPDATE(id), orderData),
  
  getUserOrders: (userId: string): Promise<{ orders: Order[] }> => 
    apiClient.get(API_ENDPOINTS.ORDERS.USER_ORDERS(userId)),
};

export const usersAPI = {
  getUsers: (params?: Record<string, string>): Promise<{ users: User[]; pagination: any }> => 
    apiClient.get(`${API_ENDPOINTS.USERS.LIST}${params ? `?${new URLSearchParams(params)}` : ''}`),
  
  getUser: (id: string): Promise<{ user: User }> => 
    apiClient.get(API_ENDPOINTS.USERS.DETAIL(id)),
  
  updateUser: (id: string, userData: Partial<User>): Promise<{ message: string; user: User }> => 
    apiClient.put(API_ENDPOINTS.USERS.UPDATE(id), userData),
  
  deleteUser: (id: string): Promise<{ message: string }> => 
    apiClient.delete(API_ENDPOINTS.USERS.DELETE(id)),
};

export const adminAPI = {
  getDashboard: (): Promise<{ success: boolean; data: any }> => 
    apiClient.get(API_ENDPOINTS.ADMIN.DASHBOARD),
  
  getAnalytics: (params?: Record<string, string>): Promise<{ success: boolean; data: any }> => 
    apiClient.get(`${API_ENDPOINTS.ADMIN.ANALYTICS}${params ? `?${new URLSearchParams(params)}` : ''}`),
  
  getCustomers: (params?: Record<string, string>): Promise<{ success: boolean; customers: User[]; pagination: any }> => 
    apiClient.get(`${API_ENDPOINTS.ADMIN.CUSTOMERS}${params ? `?${new URLSearchParams(params)}` : ''}`),
  
  updateCustomer: (id: string, customerData: Partial<User>): Promise<{ message: string; user: User }> => 
    apiClient.put(`/api/admin/customers/${id}`, customerData),
  
  deleteCustomer: (id: string): Promise<{ message: string }> => 
    apiClient.delete(`/api/admin/customers/${id}`),
};
