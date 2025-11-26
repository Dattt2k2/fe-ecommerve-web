import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'http://api.example.com';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    // Map frontend status to backend format
    const statusMap: Record<string, string> = {
      'PENDING': 'pending',
      'PROCESSING': 'processing',
      'DELIVERING': 'shipping',
      'DELIVERED': 'delivered',
      'CANCELLED': 'cancelled',
    };

    const frontendStatus = (body.status || '').toUpperCase();
    const backendStatus = statusMap[frontendStatus] || body.status?.toLowerCase() || body.status;

    const requestBody: any = {};
    if (['shipping', 'delivered', 'processing'].includes(backendStatus)) {
      requestBody.shipping_status = backendStatus;
    } else if (backendStatus === 'cancelled') {
      requestBody.status = backendStatus;
    } else {
      // For PENDING or other statuses, try both
      requestBody.shipping_status = backendStatus;
      requestBody.status = backendStatus;
    }

    console.log(`[API /orders/${id}/update-status] Mapped status:`, frontendStatus, '->', backendStatus, 'requestBody:', requestBody);

    // Forward to backend API
    const backendUrl = `${BACKEND_URL}/orders/${id}/update-status`;
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`[API /orders/${id}/update-status] Backend response:`, response.status);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to update order status' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('[API /orders/update-status] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
