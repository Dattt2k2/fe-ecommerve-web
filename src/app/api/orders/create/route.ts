import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001';

// POST /api/orders/create - Create order from checkout page
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

    // Get order data from request body
    const orderData = await request.json();

    console.log('[API /orders/create] Creating order:', orderData);

    // Build headers for backend request
    const forwardHeaders: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    // Add Authorization header if available
    if (authHeader) {
      forwardHeaders['Authorization'] = authHeader;
    }

    // Try to send to backend's order creation endpoint
    // Use fetch with redirect: 'follow' and manually handle it
    const response = await fetch(`${BACKEND_URL}/order`, {
      method: 'POST',
      headers: forwardHeaders,
      body: JSON.stringify(orderData),
      redirect: 'follow', // Follow redirects
    });

    console.log('[API /orders/create] Backend response status:', response.status);
    console.log('[API /orders/create] Response URL:', response.url);

    const text = await response.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      data = text;
    }

    if (!response.ok && response.status !== 200) {
      console.error('[API /orders/create] Backend error:', data);
      return NextResponse.json(
        { error: data?.error || data || 'Failed to create order' },
        { status: response.status }
      );
    }

    console.log('[API /orders/create] Order created successfully:', data);

    // Extract order ID from data or response URL
    let orderId = data?.id || data?._id || data?.order_id;
    
    // If no orderId in data, try to extract from URL
    if (!orderId && response.url) {
      try {
        const url = new URL(response.url);
        orderId = url.searchParams.get('order_id') || url.searchParams.get('orderId');
      } catch (e) {
        console.log('[API /orders/create] Could not parse response URL:', response.url);
      }
    }

    // Return the created order data
    return NextResponse.json({
      id: orderId || 'unknown',
      ...data,
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API /orders/create] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
