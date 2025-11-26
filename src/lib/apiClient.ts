// Gọi thông qua proxy của Next.js (server)
const API_BASE_URL = '';  // Gọi qua localhost (Next.js server)

const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {};
  
  // Lấy token từ localStorage - thử nhiều key khác nhau
  if (typeof window !== 'undefined') {
    let token = localStorage.getItem('access_token') || 
                localStorage.getItem('token') || 
                localStorage.getItem('auth_token');
    
    if (token) {
      // Nếu token không chứa "Bearer", thêm vào
      if (!token.startsWith('Bearer ')) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        headers['Authorization'] = token;
      }
      console.log('[apiClient] Token found, Authorization header set');
    } else {
      console.log('[apiClient] No token found in localStorage');
    }
  }
  
  return headers;
};

// Helper function to attempt token refresh
const tryRefreshToken = async (): Promise<boolean> => {
  try {
    console.log('[apiClient] Attempting to refresh token...');
    if (typeof window === 'undefined') return false;
    
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      console.log('[apiClient] No refresh token found');
      handleAuthError();
      return false;
    }

    // Call refresh token API
    const refreshUrl = '/auth/refresh-token';
    const res = await fetch(refreshUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'refresh_token': refreshToken
      }),
    });
    
    console.log('[apiClient] Refresh API response status:', res.status);
    
    if (!res.ok) {
      if (res.status === 401) {
        // Refresh token is invalid/expired, logout
        console.log('[apiClient] Refresh token expired (401), logging out');
        handleAuthError();
      }
      return false;
    }
    
    const data = await res.json().catch(() => ({}));
    console.log('[apiClient] Refresh API response data:', data);
    const newAccess = data?.access_token || data?.token || data?.auth_token;
    const newRefresh = data?.refresh_token;
    
    if (newAccess) {
      try { 
        localStorage.setItem('auth_token', newAccess); 
        if (newRefresh) {
          localStorage.setItem('refresh_token', newRefresh);
        }
        console.log('[apiClient] Tokens saved to localStorage');
        return true;
      } catch (e) {
        console.error('[apiClient] Error saving tokens:', e);
        return false;
      }
    }
    
    console.log('[apiClient] No access token in refresh response');
    return false;
  } catch (e) {
    console.error('[apiClient] Error during token refresh:', e);
    return false;
  }
};

// Helper function to handle auth errors (logout)
const handleAuthError = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_id');
      document.cookie = 'auth-token=; path=/; max-age=0';
    } catch (e) {
      console.error('[apiClient] Error clearing auth data:', e);
    }
    // Redirect to login page
    window.location.href = '/auth/login';
  }
};

// Helper function to make request with retry on 401
const makeRequest = async (
  endpoint: string,
  options: {
    method: string;
    body?: any;
    headers?: Record<string, string>;
  }
): Promise<any> => {
  const authHeaders = getAuthHeaders();
  const config: RequestInit = {
    method: options.method,
    headers: {
      'Accept': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
  };

  if (options.body !== undefined) {
    config.headers = {
      ...config.headers,
      'Content-Type': 'application/json',
    };
    config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  // Handle 401 Unauthorized - try to refresh token
  if (response.status === 401) {
    // Don't refresh token for login/register endpoints
    const isAuthEndpoint = endpoint.includes('/auth/login') || endpoint.includes('/auth/register') || endpoint.includes('/auth/refresh-token');
    
    if (!isAuthEndpoint) {
      console.log('[apiClient] 401 error detected, attempting token refresh...');
      const refreshed = await tryRefreshToken();
      
      if (refreshed) {
        // Retry the request with new token
        const newAuthHeaders = getAuthHeaders();
        const retryConfig: RequestInit = {
          ...config,
          headers: {
            ...config.headers,
            ...newAuthHeaders,
          },
        };
        
        response = await fetch(`${API_BASE_URL}${endpoint}`, retryConfig);
        
        // If retry still fails with 401, logout
        if (response.status === 401) {
          console.log('[apiClient] Retry after refresh still returned 401, logging out');
          handleAuthError();
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || 'Authentication failed');
        }
      } else {
        // Refresh failed, already logged out in tryRefreshToken
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Authentication failed');
      }
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Failed to ${options.method.toLowerCase()} data`);
  }

  return response.json();
};

export const apiClient = {
  async get(endpoint: string, headers: Record<string, string> = {}) {
    return makeRequest(endpoint, {
      method: 'GET',
      headers,
    });
  },

  async post(endpoint: string, body: any, headers: Record<string, string> = {}) {
    return makeRequest(endpoint, {
      method: 'POST',
      body,
      headers,
    });
  },

  async put(endpoint: string, body: any, headers: Record<string, string> = {}) {
    return makeRequest(endpoint, {
      method: 'PUT',
      body,
      headers,
    });
  },

  async delete(endpoint: string, headers: Record<string, string> = {}) {
    return makeRequest(endpoint, {
      method: 'DELETE',
      headers,
    });
  },

  async patch(endpoint: string, body: any, headers: Record<string, string> = {}) {
    return makeRequest(endpoint, {
      method: 'PATCH',
      body,
      headers,
    });
  },
};