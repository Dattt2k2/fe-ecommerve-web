import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'http://localhost:8080';

// POST /api/cart/add/[product_id] - Add item to cart
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

    if (!response.ok) {
      // Handle 403 - trying to add own product to cart
      if (response.status === 403) {
        return NextResponse.json(
          { message: data.message || 'Bạn không thể thêm sản phẩm của chính mình vào giỏ hàng' },
          { status: 403 }
        );
      }
      
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
