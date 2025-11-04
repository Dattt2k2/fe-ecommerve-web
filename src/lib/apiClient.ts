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

export const apiClient = {
  async get(endpoint: string, headers: Record<string, string> = {}) {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...authHeaders,
        ...headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch data');
    }

    return response.json();
  },

  async post(endpoint: string, body: any, headers: Record<string, string> = {}) {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...authHeaders,
        ...headers,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to post data');
    }

    return response.json();
  },

  async put(endpoint: string, body: any, headers: Record<string, string> = {}) {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...authHeaders,
        ...headers,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update data');
    }

    return response.json();
  },

  async delete(endpoint: string, headers: Record<string, string> = {}) {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        ...authHeaders,
        ...headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete data');
    }

    return response.json();
  },
};