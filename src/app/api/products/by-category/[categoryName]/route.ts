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
 * GET - Lấy danh sách sản phẩm theo category
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryName: string }> }
) {
  try {
    const { categoryName } = await params;
    const searchParams = request.nextUrl.searchParams;
    
    // Decode category name from URL
    const decodedCategoryName = decodeURIComponent(categoryName);
    
    // Build backend endpoint
    let endpoint = `/products/get/category/${decodedCategoryName}`;
    
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
      endpoint += `?${paginationParams.join('&')}`;
    }
    
    // Get auth header (optional for public endpoint)
    const authHeader = getAuthHeader(request);
    
    console.log(`[ProductsCategoryAPI] Forwarding GET request to backend: ${BACKEND_URL}${endpoint}`);
    
    const forwardHeaders: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    
    if (authHeader) {
      forwardHeaders['Authorization'] = authHeader;
    }
    
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'GET',
      headers: forwardHeaders,
      cache: 'no-store',
    });
    
    console.log(`[ProductsCategoryAPI] Backend response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ProductsCategoryAPI] Backend error:`, errorText);
      
      // For 401, return empty array instead of error (public endpoint)
      if (response.status === 401) {
        return NextResponse.json(
          { 
            data: [], 
            products: [],
            pagination: { page: 1, total: 0, pages: 1, has_next: false, has_prev: false }
          },
          { status: 200 }
        );
      }
      
      return NextResponse.json(
        { error: errorText || 'Failed to fetch products' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    // Normalize response format
    const productsArray = Array.isArray(data.data) ? data.data : (data.products || []);
    const total = data.total || data.pagination?.total || 0;
    const currentPage = data.page || data.pagination?.page || 1;
    const limit = data.limit || data.pagination?.limit || 10;
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;
    
    const normalizedResponse = {
      data: productsArray,
      products: productsArray,
      pagination: {
        page: currentPage,
        total: total,
        pages: totalPages,
        has_next: data.has_next || data.pagination?.has_next || false,
        has_prev: data.has_prev || data.pagination?.has_prev || false
      }
    };
    
    console.log(`[ProductsCategoryAPI] Successfully fetched ${productsArray.length} products for category: ${decodedCategoryName}`);
    return NextResponse.json(normalizedResponse);
    
  } catch (error: any) {
    console.error(`[ProductsCategoryAPI] Error:`, error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch products by category',
        details: error.message,
        data: [],
        products: [],
        pagination: { page: 1, total: 0, pages: 1, has_next: false, has_prev: false }
      },
      { status: 500 }
    );
  }
}

