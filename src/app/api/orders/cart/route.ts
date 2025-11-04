import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'http://api.example.com';

// POST /api/orders/cart - Create order from cart
export async function POST(request: NextRequest) {
  try {
    // Get Authorization header or token from Cookie
    let authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');

    // If no Authorization header, try to extract token from cookie
    if (!authHeader && cookieHeader) {
      const tokenMatch = cookieHeader.match(/auth-token=([^;]+)/);
      if (tokenMatch) {
        authHeader = `Bearer ${tokenMatch[1]}`;
      }
    }

    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Get order data from request body
    const orderData = await request.json();

    console.log('[API /orders/cart] Creating order from cart:', orderData);

    // Build headers for backend request
    const forwardHeaders: Record<string, string> = {
      'Accept': request.headers.get('accept') || 'application/json',
      'Content-Type': 'application/json',
      'Authorization': authHeader,
    };

    const response = await fetch(`${BACKEND_URL}/order/cart`, {
      method: 'POST',
      headers: forwardHeaders,
      body: JSON.stringify(orderData),
    });

    console.log('[API /orders/cart] Backend response status:', response.status);

    const text = await response.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      data = text;
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: data || 'Failed to create order from cart' },
        { status: response.status }
      );
    }

    console.log('[API /orders/cart] Order created successfully from cart');
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('[API /orders/cart] Error:', error);
    return NextResponse.json({ error: 'Failed to create order from cart' }, { status: 500 });
  }
}
