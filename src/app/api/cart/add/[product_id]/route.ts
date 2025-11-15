import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'http://api.example.com';
// Note: server routes cannot use React hooks like useToast. Instead, return status messages and let the frontend display toasts.

export async function POST(
  request: NextRequest,
  { params }: { params: { product_id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { message: 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const productId = params.product_id;
    
    const response = await fetch(`${API_BASE_URL}/api/user/cart/add/${productId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({ message: 'Failed to add to cart' }));

    // No server-side toast: return success message to client to handle

    if (!response.ok) {
      // Handle 500 - trying to add own product to cart
      // If server returns 500 and indicates own-product, return as-is for frontend to display
      
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi thêm vào giỏ hàng' },
      { status: 500 }
    );
  }
}
