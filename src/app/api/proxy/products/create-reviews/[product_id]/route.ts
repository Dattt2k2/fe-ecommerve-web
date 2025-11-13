import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://api.example.com';

export async function POST(request: NextRequest, { params }: { params: { product_id: string } }) {
  const { product_id } = params;

  try {
    const reviewData = await request.json();

    // Lấy auth-token từ cookie
    const cookies = request.headers.get('cookie') || '';
    const authToken = cookies.split('; ').find(cookie => cookie.startsWith('auth-token='))?.split('=')[1] || '';

    console.log('[Proxy] Authorization header:', authToken);

    console.log('[Proxy] Forwarding request to backend:', {
      url: `${BACKEND_URL}/products/create-reviews/${product_id}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: reviewData,
    });

    const response = await fetch(`${BACKEND_URL}/products/create-reviews/${product_id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(reviewData),
    });

    const responseText = await response.text();
    try {
      const responseData = JSON.parse(responseText);
      return NextResponse.json(responseData, { status: response.status });
    } catch (parseError) {
      console.error('[Proxy Error] Failed to parse JSON response:', responseText);
      return NextResponse.json(
        { error: 'Invalid JSON response from backend', details: responseText },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Proxy Error] Failed to forward request:', error);
    return NextResponse.json({ error: 'Failed to forward request', details: String(error) }, { status: 500 });
  }
}