import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'http://api.example.com';

// Helper function to get auth header
function getAuthHeader(request: NextRequest): string | null {
  let authHeader = request.headers.get('authorization');
  const cookieHeader = request.headers.get('cookie');

  if (!authHeader && cookieHeader) {
    const tokenMatch = cookieHeader.match(/auth-token=([^;]+)/);
    if (tokenMatch) {
      authHeader = `Bearer ${tokenMatch[1]}`;
    }
  }

  return authHeader;
}

/**
 * GET - Lấy danh sách sản phẩm
 */
export async function GET(request: NextRequest) {
  try {
    // Lấy các tham số tìm kiếm từ URL
    const searchParams = request.nextUrl.searchParams;
    
    // Xác định endpoint dựa trên query params
    let endpoint = '/products/get/all';
    let requiresAuth = false;
    
    if (searchParams.get('user')) {
      endpoint = '/products/user';
      requiresAuth = true;
    } else if (searchParams.get('category')) {
      endpoint = `/products/get/category/${searchParams.get('category')}`;
      requiresAuth = false;
    } else if (searchParams.get('id')) {
      endpoint = `/products/get/${searchParams.get('id')}`;
      requiresAuth = false;
    }
    
    // Forward pagination params (page, limit) to backend
    const paginationParams: string[] = [];
    if (searchParams.get('page')) {
      paginationParams.push(`page=${searchParams.get('page')}`);
    }
    if (searchParams.get('limit')) {
      paginationParams.push(`limit=${searchParams.get('limit')}`);
    }
    
    // Forward other query params (search, sortBy, sortOrder, etc.)
    const otherParams = ['search', 'sortBy', 'sortOrder'];
    otherParams.forEach(param => {
      if (searchParams.get(param)) {
        paginationParams.push(`${param}=${encodeURIComponent(searchParams.get(param)!)}`);
      }
    });
    
    if (paginationParams.length > 0) {
      const separator = endpoint.includes('?') ? '&' : '?';
      endpoint += `${separator}${paginationParams.join('&')}`;
    }
    
    // Check authorization if required
    let authHeader = null;
    if (requiresAuth) {
      authHeader = getAuthHeader(request);
      if (!authHeader) {
        return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
      }
    } else {
      // Try to get auth header if available (optional)
      authHeader = getAuthHeader(request);
    }
    
    console.log(`[ProductsAPI] Forwarding GET request to backend: ${BACKEND_URL}${endpoint}`);
    
    const forwardHeaders: Record<string, string> = {
      'Accept': 'application/json',
    };
    
    // Add authorization only if endpoint requires it
    // Forwarding an invalid or stale Authorization header to backend
    // can cause the backend to respond with 401 even for public endpoints.
    if (requiresAuth && authHeader) {
      forwardHeaders['Authorization'] = authHeader;
    }

    // Gọi API backend thực
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'GET',
      headers: forwardHeaders,
      cache: 'no-store'
    });

    // Xử lý lỗi từ backend
    if (!response.ok) {
      console.error(`[ProductsAPI] Backend returned error status: ${response.status}`);
      return NextResponse.json(
        { error: `Backend returned status: ${response.status}` },
        { status: response.status }
      );
    }

    // Trả về dữ liệu từ backend
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error(`[ProductsAPI] Error: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

/**
 * POST - Tạo sản phẩm mới
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = getAuthHeader(request);
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const productData = await request.json();
    
    console.log(`[ProductsAPI] Forwarding POST request to backend: /products/add`);
    
    const forwardHeaders: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': authHeader,
    };

    const response = await fetch(`${BACKEND_URL}/products/add`, {
      method: 'POST',
      headers: forwardHeaders,
      body: JSON.stringify(productData),
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error(`[ProductsAPI] Backend returned error status on POST: ${response.status}`);
      return NextResponse.json(
        { error: `Backend returned status: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
    
  } catch (error) {
    console.error(`[ProductsAPI] Error: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Cập nhật sản phẩm
 */
export async function PUT(request: NextRequest) {
  try {
    const authHeader = getAuthHeader(request);
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const { id, ...productData } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }
    
    console.log(`[ProductsAPI] Forwarding PUT request to backend: /products/edit/${id}`);
    
    const forwardHeaders: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': authHeader,
    };

    const response = await fetch(`${BACKEND_URL}/products/edit/${id}`, {
      method: 'PUT',
      headers: forwardHeaders,
      body: JSON.stringify(productData),
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error(`[ProductsAPI] Backend returned error status on PUT: ${response.status}`);
      return NextResponse.json(
        { error: `Backend returned status: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error(`[ProductsAPI] Error: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Xóa sản phẩm
 */
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = getAuthHeader(request);
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }
    
    console.log(`[ProductsAPI] Forwarding DELETE request to backend: /products/delete/${id}`);
    
    const forwardHeaders: Record<string, string> = {
      'Accept': 'application/json',
      'Authorization': authHeader,
    };

    const response = await fetch(`${BACKEND_URL}/products/delete/${id}`, {
      method: 'DELETE',
      headers: forwardHeaders,
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error(`[ProductsAPI] Backend returned error status on DELETE: ${response.status}`);
      return NextResponse.json(
        { error: `Backend returned status: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error(`[ProductsAPI] Error: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}

/**
 * Handle OPTIONS request for CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}