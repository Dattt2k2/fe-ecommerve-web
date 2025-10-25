import { NextRequest, NextResponse } from 'next/server';

/**
 * Route handler cho chi tiết sản phẩm - chuyển tiếp yêu cầu đến backend thực
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  try {
    // URL trực tiếp đến backend - sử dụng endpoint products-info
    const backendUrl = `http://localhost:8080/api/products-info/${id}`;
    console.log(`[ProductAPI] Forwarding request to backend: ${backendUrl}`);
    
    // Gọi API backend thực
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store'
    });
    
    // Chuyển tiếp phản hồi từ backend
    if (!response.ok) {
      console.error(`[ProductAPI] Backend returned error status: ${response.status}`);
      return NextResponse.json(
        { error: `Backend returned status: ${response.status}` },
        { status: response.status }
      );
    }
    
    // Trả về dữ liệu từ backend
    const data = await response.json();
    console.log(`[ProductAPI] Successfully forwarded product ${id} from backend`);
    return NextResponse.json(data);
    
  } catch (error) {
    console.error(`[ProductAPI] Error connecting to backend: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json(
      { error: 'Lỗi kết nối đến backend', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PUT - Chuyển tiếp cập nhật sản phẩm đến backend
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  try {
    // Lấy dữ liệu từ request
    const productData = await request.json();
    
    // URL trực tiếp đến backend
    const backendUrl = `http://localhost:8080/api/products/${id}`;
    console.log(`[ProductAPI] Forwarding PUT request to backend: ${backendUrl}`);
    
    // Gọi API backend thực
    const response = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(productData),
      cache: 'no-store'
    });
    
    // Chuyển tiếp phản hồi từ backend
    if (!response.ok) {
      console.error(`[ProductAPI] Backend returned error status on PUT: ${response.status}`);
      return NextResponse.json(
        { error: `Backend returned status: ${response.status}` },
        { status: response.status }
      );
    }
    
    // Trả về dữ liệu từ backend
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error(`[ProductAPI] Error on PUT: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json(
      { error: 'Lỗi kết nối đến backend', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Chuyển tiếp xóa sản phẩm đến backend
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  try {
    // URL trực tiếp đến backend
    const backendUrl = `http://localhost:8080/api/products/${id}`;
    console.log(`[ProductAPI] Forwarding DELETE request to backend: ${backendUrl}`);
    
    // Gọi API backend thực
    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store'
    });
    
    // Chuyển tiếp phản hồi từ backend
    if (!response.ok) {
      console.error(`[ProductAPI] Backend returned error status on DELETE: ${response.status}`);
      return NextResponse.json(
        { error: `Backend returned status: ${response.status}` },
        { status: response.status }
      );
    }
    
    // Trả về dữ liệu từ backend
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error(`[ProductAPI] Error on DELETE: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json(
      { error: 'Lỗi kết nối đến backend', details: String(error) },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
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
