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

    console.log(`[API /orders/${id}/update-status] Forwarding to backend with status:`, body.status);

    // Forward to backend API
    const backendUrl = `${BACKEND_URL}/orders/${id}/update-status`;
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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
