import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'http://localhost:8080';

// GET /api/cart - Get cart items
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { items: [], total: 0, success: true },
        { status: 200 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/user/cart/get`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 404) {
        return NextResponse.json(
          { items: [], total: 0, success: true },
          { status: 200 }
        );
      }
      
      const errorData = await response.json().catch(() => ({ message: 'Failed to get cart' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { items: [], total: 0, success: true },
      { status: 200 }
    );
  }
}

// DELETE /api/cart - Clear cart
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const isClear = url.pathname.endsWith('/clear');

    const endpoint = isClear 
      ? `${API_BASE_URL}/api/user/cart/clear`
      : `${API_BASE_URL}/api/user/cart`;

    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({ message: 'Cart cleared' }));

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json(
      { message: 'Có lỗi xảy ra' },
      { status: 500 }
    );
  }
}
