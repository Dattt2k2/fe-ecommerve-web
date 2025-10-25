import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route Handler cho sản phẩm - chuyển tiếp tất cả yêu cầu đến backend
 */

/**
 * GET - Lấy danh sách sản phẩm với bộ lọc tùy chọn
 */
export async function GET(request: NextRequest) {
  try {
    // Lấy các tham số tìm kiếm từ URL
    const searchParams = request.nextUrl.searchParams;
    
    // URL trực tiếp đến backend với tham số
    const backendUrl = new URL('http://localhost:8080/api/products');
    
    // Chuyển tiếp tất cả tham số tìm kiếm đến backend
    searchParams.forEach((value, key) => {
      backendUrl.searchParams.append(key, value);
    });
    
    console.log(`[ProductsAPI] Forwarding request to backend: ${backendUrl.toString()}`);
    
    // Gọi API backend thực
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
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
      { error: 'Lỗi kết nối đến backend', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST - Tạo sản phẩm mới (chỉ admin)
 */
export async function POST(request: NextRequest) {
  try {
    // Lấy dữ liệu từ request
    const productData = await request.json();
    
    // URL trực tiếp đến backend
    const backendUrl = 'http://localhost:8080/api/products';
    console.log(`[ProductsAPI] Forwarding POST request to backend: ${backendUrl}`);
    
    // Gọi API backend thực
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(productData),
      cache: 'no-store'
    });
    
    // Xử lý lỗi từ backend
    if (!response.ok) {
      console.error(`[ProductsAPI] Backend returned error status on POST: ${response.status}`);
      return NextResponse.json(
        { error: `Backend returned status: ${response.status}` },
        { status: response.status }
      );
    }
    
    // Trả về dữ liệu từ backend
    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
    
  } catch (error) {
    console.error(`[ProductsAPI] Error on POST: ${error instanceof Error ? error.message : String(error)}`);
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}