import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG, API_ENDPOINTS } from '@/lib/api';

/**
 * GET - Lấy danh sách review của sản phẩm
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ product_id: string }> }
) {
  const { product_id } = await params;
  
  try {
    const backendUrl = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.REVIEWS.LIST(product_id)}`;
    console.log(`[ReviewAPI] Forwarding GET request to backend: ${backendUrl}`);
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': '/*',
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ReviewAPI] Backend returned error status on GET: ${response.status}`, errorText);
      
      // Return appropriate error response
      if (response.status === 404 || response.status === 401) {
        // No reviews or not authenticated - return empty list
        return NextResponse.json({ reviews: [] }, { status: 200 });
      }
      
      return NextResponse.json(
        { error: `Backend returned status: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }
    
    const responseText = await response.text();
    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data);
    } catch (parseError) {
      console.error('[ReviewAPI] Failed to parse JSON response:', responseText);
      return NextResponse.json(
        { error: 'Invalid JSON response from backend', details: responseText },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error(`[ReviewAPI] Error on GET: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json(
      { error: 'Lỗi kết nối đến backend', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST - Tạo review mới cho sản phẩm
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ product_id: string }> }
) {
  const { product_id } = await params;
  
  try {
    // Lấy dữ liệu từ request
    const reviewData = await request.json();
    
    // Lấy token từ headers
    const authHeader = request.headers.get('Authorization');
    
    const backendUrl = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.REVIEWS.CREATE(product_id)}`;
    console.log(`[ReviewAPI] Forwarding POST request to backend: ${backendUrl}`);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': '/*',
    };
    
    // Forward Authorization header if present
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(reviewData),
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ReviewAPI] Backend returned error status on POST: ${response.status}`, errorText);
      
      // Handle 401 Unauthorized
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Bạn cần đăng nhập để đánh giá sản phẩm' },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: `Backend returned status: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }
    
    const responseText = await response.text();
    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data, { status: 201 });
    } catch (parseError) {
      console.error('[ReviewAPI] Failed to parse JSON response:', responseText);
      return NextResponse.json(
        { error: 'Invalid JSON response from backend', details: responseText },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error(`[ReviewAPI] Error on POST: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json(
      { error: 'Lỗi kết nối đến backend', details: String(error) },
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
