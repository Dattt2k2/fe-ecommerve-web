// API configuration
import { LoginResponse, RegisterResponse, User, Product, Order } from '@/types';

// Configuration
const API_BASE_URL = 'http://localhost:8080';
const IS_SERVER = typeof window === 'undefined';
const USE_INTERNAL_API = false; // Always use external API

// Add a flag that forces direct backend access
// Enable direct backend access (bypassing Next.js routing completely)
const DIRECT_BACKEND = true;

// API endpoints - sử dụng Next.js internal API routes khi không có external API
export const API_ENDPOINTS = {
  AUTH: {
    // Always target the gateway `/api` routes so frontend calls go to the API gateway
    LOGIN: 'auth/users/login',
    REGISTER: 'auth/users/register',
    LOGOUT: 'auth/users/logout',
    REFRESH: 'auth/users/refresh',
    // Note: No PROFILE endpoint - use USERS.DETAIL(userId) instead (GET /api/user/users/:id)
  },  PRODUCTS: {
    LIST: USE_INTERNAL_API ? '/api/products' : '/api/products',
    DETAIL: (id: string) => USE_INTERNAL_API ? `/api/products-info/${id}` : `/api/products-info/${id}`,
    CREATE: USE_INTERNAL_API ? '/api/products' : '/api/seller/products',
    UPDATE: (id: string) => USE_INTERNAL_API ? `/api/products/${id}` : `/api/seller/products/${id}`,
    DELETE: (id: string) => USE_INTERNAL_API ? `/api/products/${id}` : `/api/seller/products/${id}`,
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
    LIST: USE_INTERNAL_API ? '/api/users' : '/api/user/users',
    DETAIL: () => USE_INTERNAL_API ? `/api/user/users` : `/api/user/users`,
    UPDATE: () => USE_INTERNAL_API ? `/api/users` : `/api/user/users/update`,
    DELETE: () => USE_INTERNAL_API ? `/api/users` : `/api/user/users/delete`,
  },
  ADMIN: {
    DASHBOARD: USE_INTERNAL_API ? '/api/admin/dashboard' : '/api/admin/dashboard',
    ANALYTICS: USE_INTERNAL_API ? '/api/admin/analytics' : '/api/admin/analytics',
    CUSTOMERS: USE_INTERNAL_API ? '/api/admin/customers' : '/api/admin/customers',
  },
  UPLOAD: {
    PRESIGNED_URL: USE_INTERNAL_API ? '/api/upload/presigned-url' : '/api/user/upload/presigned-url',
    UPLOAD_FILE: USE_INTERNAL_API ? '/api/upload/file' : '/api/user/upload/file',
  },
  REVIEWS: {
    LIST: (productId: string) => `/api/user/product/review/${productId}`,
    CREATE: (productId: string) => `/api/user/product/review/${productId}`,
  },
  CART: {
    ADD: (productId: string) => `/api/user/cart/add/${productId}`,
    LIST: '/api/user/cart/get',
    UPDATE: (itemId: string) => `/api/user/cart/update/${itemId}`,
    REMOVE: (itemId: string) => `/api/user/cart/delete/${itemId}`,
    CLEAR: '/api/user/cart/clear',
  }
};

/**
 * Special fetch function that works consistently on both server and client
 * This ensures no _rsc parameters are added on server components
 */
async function safeFetch(url: string, options: RequestInit = {}) {
  // Always use absolute URL
  const isAbsoluteUrl = url.startsWith('http://') || url.startsWith('https://');
  let absoluteUrl = isAbsoluteUrl ? url : new URL(url, API_BASE_URL).toString();
  
  // VERY IMPORTANT: Override with direct backend URL to bypass Next.js RSC processing
  // Either when running on the server or when DIRECT_BACKEND flag is set
  if (typeof window === 'undefined') {
    // Parse URL to manipulate it
    const urlObj = new URL(absoluteUrl);
    
    // Extract path and query parts (keep API path intact)
    const path = urlObj.pathname;
    const query = urlObj.search;
    
    // Remove any potential _rsc params that might have been added
    urlObj.searchParams.delete('_rsc');
    
    // Force the URL to use backend host/port directly
    urlObj.host = 'localhost:8080';
    urlObj.protocol = 'http:';
    absoluteUrl = urlObj.toString();
  }

  // Set no-store for both server and client
  const fetchOptions: RequestInit = {
    ...options,
    cache: 'no-store',
    mode: 'cors',  // Enable CORS explicitly
    referrerPolicy: 'no-referrer', // Solve the Referrer Policy issue
    credentials: 'omit', // Don't send cookies (using Bearer token instead)
    // Add these headers to prevent Next.js from adding _rsc params
    headers: {
      ...options.headers,
      'x-nextjs-data': '1',  // Signal this is a data request
    },
  };

  return fetch(absoluteUrl, fetchOptions);
}

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
    // Determine if this is an internal Next.js API route or external backend API
    const isInternalRoute = endpoint.startsWith('/api/');
    
    // For internal routes, use relative path. For external, use full backend URL
    const ep = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = isInternalRoute ? ep : new URL(ep, API_BASE_URL).toString();

    console.log('[ApiClient] Request URL:', url);
    console.log('[ApiClient] Endpoint:', endpoint);
    console.log('[ApiClient] Is Internal Route:', isInternalRoute);
    
    // Get token from localStorage or cookies (only in browser)
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    // Helper to attempt token refresh using refresh_token in storage
    const tryRefresh = async (): Promise<boolean> => {
      try {
        console.log('[ApiClient] tryRefresh called');
        if (typeof window === 'undefined') return false;
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          // No refresh token available, logout
          console.log('[ApiClient] No refresh token found, logging out');
          this.handleAuthError();
          return false;
        }

        console.log('[ApiClient] Refresh token exists, attempting refresh...');
        // Build refresh URL (bypass request wrapper to avoid recursion)
        const buildUrl = (base: string, ep: string) => {
          if (!base) return ep;
          const b = base.endsWith('/') ? base.slice(0, -1) : base;
          const e = ep.startsWith('/') ? ep : `/${ep}`;
          return `${b}${e}`;
        };

        const refreshUrl = USE_INTERNAL_API ? API_ENDPOINTS.AUTH.REFRESH : buildUrl(this.baseURL, API_ENDPOINTS.AUTH.REFRESH);
        const res = await safeFetch(refreshUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        
        console.log('[ApiClient] Refresh API response status:', res.status);
        
        if (!res.ok) {
          // Refresh token call failed
          if (res.status === 401) {
            // Refresh token is invalid/expired, logout
            console.log('[ApiClient] Refresh token expired (401), logging out');
            this.handleAuthError();
          } else {
            console.log('[ApiClient] Refresh failed with status:', res.status, '- NOT logging out');
          }
          // For other errors, don't logout
          return false;
        }
        
        const d = await res.json().catch(() => ({}));
        const newAccess = d?.access_token || d?.token || d?.auth_token;
        const newRefresh = d?.refresh_token;
        if (newAccess) {
          try { localStorage.setItem('auth_token', newAccess); } catch (e) {}
          if (newRefresh) try { localStorage.setItem('refresh_token', newRefresh); } catch (e) {}
          return true;
        }
        return false;
      } catch (e) {
        return false;
      }
    };

    try {
      // Use fetch for internal Next.js routes, safeFetch for external backend
      let response = isInternalRoute 
        ? await fetch(url, config)
        : await safeFetch(url, config);
      
      // Handle authentication errors (401)
      if (response.status === 401) {
        // Don't trigger handleAuthError on login/register endpoints, review GET requests, cart operations, or user profile fetch
        const isLoginEndpoint = url.includes('/login') || url.includes('/register');
        const isReviewGetRequest = url.includes('/review/') && config.method === 'GET';
        const isCartOperation = url.includes('/cart');
        const isUserProfileFetch = url.includes('/users') && config.method === 'GET';
        
        console.log('[ApiClient] 401 Error:', {
          url,
          method: config.method,
          isLoginEndpoint,
          isReviewGetRequest,
          isCartOperation,
          isUserProfileFetch
        });
        
        if (!isLoginEndpoint && !isReviewGetRequest && !isCartOperation && !isUserProfileFetch) {
          console.log('[ApiClient] Attempting token refresh...');
          // Attempt refresh once for authenticated endpoints (only on client side)
          const refreshed = typeof window !== 'undefined' ? await tryRefresh() : false;
          console.log('[ApiClient] Refresh result:', refreshed);
          if (refreshed) {
            // rebuild config with new token
            const newToken = this.getToken();
            const newConfig = { ...config, headers: { ...(config.headers as any), ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}) } };
            response = isInternalRoute 
              ? await fetch(url, newConfig)
              : await safeFetch(url, newConfig);
          } else {
            // Refresh failed, but handleAuthError already called in tryRefresh if needed
            // Just throw the error, don't call handleAuthError again
            const errorData = await response.json().catch(() => ({}));
            const errPayload = { status: response.status, url, data: errorData };
            throw new Error(JSON.stringify(errPayload));
          }
        } else {
          // For login/register endpoints or review GET, just throw error without redirecting
          const errorData = await response.json().catch(() => ({}));
          const errPayload = { status: response.status, url, data: errorData };
          throw new Error(JSON.stringify(errPayload));
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Detect token-expired style error in error payload and treat as auth error
        try {
          const errMsg = (errorData && (errorData.error || errorData.message || errorData.msg)) || '';
          if (typeof errMsg === 'string' && /token\s*(is\s*)?expired|expired\s*token/i.test(errMsg)) {
            // Attempt refresh once when backend signals token expired in body
            const refreshed = await tryRefresh();
            if (refreshed) {
              const newToken = this.getToken();
              const newConfig = { ...config, headers: { ...(config.headers as any), ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}) } };
              const retryResp = isInternalRoute 
                ? await fetch(url, newConfig)
                : await safeFetch(url, newConfig);
              if (!retryResp.ok) {
                // if retry still fails, logout
                this.handleAuthError();
                const retryErr = await retryResp.json().catch(() => ({}));
                throw new Error(JSON.stringify({ status: retryResp.status, url, data: retryErr, auth: true }));
              }
              const retryData = await retryResp.json().catch(() => ({}));
              return retryData as T;
            }

            this.handleAuthError();
            // Stop further processing by throwing an auth-specific error
            throw new Error(JSON.stringify({ status: response.status, url, data: errorData, auth: true }));
          }
        } catch (e) {
          // ignore detection errors
        }

        const errPayload = { status: response.status, url, data: errorData };
        // Don't log 404 errors as they are expected when user is not authenticated
        if (response.status !== 404) {
        }
        throw new Error(JSON.stringify(errPayload));
      }

      const responseData = await response.json().catch(() => ({}));

      // Some backends return a successful HTTP status but include an error object/string in the body.
      // Detect token expiration messages in the response body and handle them as auth errors.
      try {
        const bodyErr = responseData && (responseData.error || responseData.message || responseData.msg);
        if (typeof bodyErr === 'string' && /token\s*(is\s*)?expired|expired\s*token/i.test(bodyErr)) {
          this.handleAuthError();
          throw new Error(JSON.stringify({ status: response.status, url, data: responseData, auth: true }));
        }
      } catch (e) {
        // ignore detection errors
      }

      return responseData;
    } catch (error: any) {
      // If error already has structured message (from our throw statements above), just re-throw it
      if (error?.message && typeof error.message === 'string') {
        try {
          // Check if it's already a JSON stringified error from our API error handling above
          const parsed = JSON.parse(error.message);
          if (parsed.status && parsed.url) {
            // This is already a structured error from our API handling above
            // Don't log 404 errors as they are expected when user is not authenticated
            if (parsed.status !== 404) {
            }
            // Just re-throw without wrapping again
            throw error;
          }
        } catch (parseError) {
          // Not a JSON error, continue with regular error handling below
        }
      }

      // This is a different kind of error (network error, etc.)
      const payload = {
        url,
        method: config.method || 'GET',
        message: error?.message ?? String(error),
        name: error?.name,
        status: error?.status,
      };
      

      // If external API fails and we're in development, suggest using internal API
      if (error && error.name === 'TypeError' && String(error.message).toLowerCase().includes('fetch')) {
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
      // Use centralized clear function
      clearAuthData();
      
      // Redirect to storefront home (product listing) when tokens expire
      window.location.href = '/';
    }
  }

  // HTTP methods
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { 
      method: 'GET',
      ...options
    });
  }

  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options
    });
  }

  async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options
    });
  }

  async patch<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...options
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { 
      method: 'DELETE',
      ...options
    });
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
    const response = await safeFetch(url, { ...config, credentials: 'include' });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    return await response.json();
  }
}

// Export API client instance
// Create API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Centralized function to clear all auth data
export function clearAuthData() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_id');
      sessionStorage.removeItem('auth_token');
      
      // Clear auth-token cookie for middleware
      document.cookie = 'auth-token=; path=/; max-age=0';
    } catch (e) {
      console.error('Error clearing auth data:', e);
    }
  }
}

// Small helper to allow other client-side code to trigger the same logout behavior
export function forceClientLogout() {
  clearAuthData();
  if (typeof window !== 'undefined') {
    // Send users back to storefront home when refresh token expired
    window.location.href = '/';
  }
}

// Export configuration for debugging
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  USE_INTERNAL_API,
  ENDPOINTS: API_ENDPOINTS
};

// Helper functions for common API calls
export const authAPI = {
  login: (email: string, password: string): Promise<LoginResponse> => {
    // Use Next.js internal API route for login instead of direct backend call
    // This avoids CORS and Referrer Policy issues
    return fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    }).then(async (response) => {
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(JSON.stringify({
          status: response.status,
          url: response.url,
          data: data
        }));
      }
      
      return data;
    });
  },
  
  register: (userData: { email: string; password: string; name: string; confirmPassword?: string }): Promise<RegisterResponse> => 
    apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000',
      },
      referrerPolicy: 'no-referrer'
    }),
  
  logout: (): Promise<{ message: string }> => 
    apiClient.post(API_ENDPOINTS.AUTH.LOGOUT),
  
  // Note: Use getUserById() instead of getProfile() - backend uses /user/users/:id endpoint
  
  refreshToken: (): Promise<LoginResponse> => 
    apiClient.post(API_ENDPOINTS.AUTH.REFRESH),
  
  getUserById: (userId: string): Promise<User> => 
    apiClient.get(API_ENDPOINTS.USERS.DETAIL()),
};

export const productsAPI = {
  getProducts: async (params?: Record<string, string>): Promise<{ products: Product[]; pagination: any }> => {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    const endpoint = `/api/products${queryString}`;
    
    
    // Always use the backend API URL (port 8080)
    try {
      const baseUrl = 'http://localhost:8080';
      // Use a new URL object to ensure it's an absolute URL (prevents Next.js from adding _rsc params)
      const fullUrl = new URL(endpoint, baseUrl).toString();
      
      
      const response = await safeFetch(fullUrl, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Backend returns: { data: [...], cached: false, page: 1, total: 2, etc }
      // Transform to expected format: { products: [...], pagination: {...} }
      return {
        products: data.data || [],
        pagination: {
          page: data.page || 1,
          total: data.total || 0,
          pages: data.pages || 1,
          has_next: data.has_next || false,
          has_prev: data.has_prev || false
        }
      };
      
    } catch (error) {
      throw error;
    }
  },
  
  getProduct: async (id: string): Promise<{ product: Product }> => {
    // IMPORTANT: Special handling for Server Components
    if (typeof window === 'undefined') {
      console.log(`[Server] Getting product ${id} directly from backend`);
    }
    
    // Get auth token - only when in browser environment
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    // Primary endpoint: /api/products-info/:id (backend route for product details)
    try {
      const mainEndpoint = `/api/products-info/${id}`;
      
      // Use DIRECT_BACKEND pattern for consistent handling
      const backendUrl = 'http://localhost:8080';
      
      // Build a direct URL to backend - completely bypassing Next.js
      const fullUrl = new URL(mainEndpoint, backendUrl).toString();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Use our custom fetch helper
      const response = await safeFetch(fullUrl, {
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        const errorText = await response.text();
        console.error(`[API] Backend returned error for product ${id}:`, {
          status: response.status,
          body: errorText.substring(0, 500)
        });
        throw new Error(`Failed to fetch product: ${response.status}`);
      }
    } catch (error) {
      console.error(`[API] Error fetching product ${id}:`, error);
      throw error;
    }
  },
  
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
  
  // Single-flight / simple cache to avoid duplicate concurrent requests for user data
  // key can be an id or 'current' for the current authenticated user
  getUser: (() => {
    const cache: Record<string, { data?: any; promise?: Promise<any> }> = {};

    return (id?: string): Promise<{ user: User } | any> => {
      const key = id || 'current';
      // Return cached data if available
      if (cache[key]?.data) {
        return Promise.resolve({ user: cache[key].data });
      }

      // If a request is already in-flight, return the same promise
      if (cache[key]?.promise) {
        return cache[key].promise as Promise<any>;
      }

      const p = apiClient.get(API_ENDPOINTS.USERS.DETAIL())
        .then((res: any) => {
          const payload = (res && (res.user || res)) || null;
          cache[key] = { data: payload };
          return res;
        })
        .catch((err) => {
          // Clear promise on error so subsequent calls can retry
          if (cache[key]) delete cache[key].promise;
          throw err;
        });

      cache[key] = { ...(cache[key] || {}), promise: p };
      return p;
    };
  })(),
  
  updateUser: (id: string, userData: Partial<User>): Promise<{ message: string; user: User }> => 
    apiClient.put(API_ENDPOINTS.USERS.UPDATE(), userData),
  
  deleteUser: (id: string): Promise<{ message: string }> => 
    apiClient.delete(API_ENDPOINTS.USERS.DELETE()),
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

export const uploadAPI = {
  // Get presigned URL for S3 upload
  getPresignedUrl: (fileName: string, fileType: string): Promise<{ 
    uploadUrl: string; 
    fileUrl: string; 
    key: string 
  }> => 
    apiClient.post(API_ENDPOINTS.UPLOAD.PRESIGNED_URL, { fileName, fileType }),
  
  // Get batch presigned URLs for multiple files
  getBatchPresignedUrls: (files: Array<{ fileName: string; fileType: string }>): Promise<{
    success: boolean;
    presignedUrls: Array<{
      originalFileName: string;
      uploadUrl: string;
      fileUrl: string;
      key: string;
    }>;
    count: number;
  }> => 
    apiClient.post('/api/upload/batch-presigned-url', { files }),
  
  // Upload file directly to server (alternative method)
  uploadFile: (formData: FormData): Promise<{ 
    success: boolean; 
    fileUrl: string; 
    fileName: string 
  }> => 
    apiClient.upload(API_ENDPOINTS.UPLOAD.UPLOAD_FILE, formData),
};

export const reviewsAPI = {
  // Get reviews for a product (via Next.js API route to avoid CORS)
  getReviews: (productId: string): Promise<{ 
    reviews?: any[]; 
    data?: any[];
    success?: boolean;
  }> => 
    apiClient.get(`/api/product/review/${productId}`),
  
  // Create a new review (via Next.js API route to avoid CORS)
  createReview: (productId: string, data: { 
    rating: number; 
    title: string; 
    body_review: string 
  }): Promise<{
    id?: string;
    user_id?: string;
    user_name?: string;
    message?: string;
    success?: boolean;
  }> => 
    apiClient.post(`/api/product/review/${productId}`, data),
};

export const cartAPI = {
  // Add item to cart
  addToCart: (data: {
    product_id: string;
    quantity: number;
    size?: string;
    color?: string;
  }): Promise<{
    message?: string;
    cart_item?: any;
    success?: boolean;
  }> => 
    apiClient.post(`/api/cart/add/${data.product_id}`, {
      quantity: data.quantity,
      size: data.size,
      color: data.color,
    }),
  
  // Get cart items
  getCart: (): Promise<{
    products?: any[];
    items?: any[];
    data?: any[];
    user_id?: string;
    total?: number;
    success?: boolean;
  }> =>
    apiClient.get(`/api/cart`),
  
  // Update cart item quantity
  updateCartItem: (itemId: string, quantity: number): Promise<{
    message?: string;
    success?: boolean;
  }> =>
    apiClient.put(`/api/cart/${itemId}`, { quantity }),
  
  // Remove item from cart
  removeFromCart: (itemId: string): Promise<{
    message?: string;
    success?: boolean;
  }> =>
    apiClient.delete(`/api/cart/${itemId}`),
  
  // Clear cart
  clearCart: (): Promise<{
    message?: string;
    success?: boolean;
  }> =>
    apiClient.delete(`/api/cart/clear`),
};
