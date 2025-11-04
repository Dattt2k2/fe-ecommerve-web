import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'http://api.example.com';

// POST /api/orders/cancel/[orderId] - Cancel order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

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

    console.log(`[API /orders/cancel/${orderId}] Cancelling order`);

    // Build headers for backend request
    const forwardHeaders: Record<string, string> = {
      'Accept': request.headers.get('accept') || 'application/json',
      'Content-Type': 'application/json',
      'Authorization': authHeader,
    };

    const response = await fetch(`${BACKEND_URL}/user/order/cancel/${orderId}`, {
      method: 'POST',
      headers: forwardHeaders,
    });

    console.log(`[API /orders/cancel/${orderId}] Backend response status:`, response.status);

    const text = await response.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      data = text;
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: data || 'Failed to cancel order' },
        { status: response.status }
      );
    }

    console.log(`[API /orders/cancel/${orderId}] Order cancelled successfully`);
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error(`[API /orders/cancel] Error:`, error);
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
  }
}
