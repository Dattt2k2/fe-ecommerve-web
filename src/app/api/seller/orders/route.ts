import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'http://api.example.com';

// GET /api/seller/orders - Get seller's orders
export async function GET(request: NextRequest) {
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

    // Extract query parameters from the request URL
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const month = searchParams.get('month'); // Optional: filter by month (1-12)
    const year = searchParams.get('year');   // Optional: filter by year
    let status = searchParams.get('status'); // Optional: filter by status (pending, confirmed, shipped, delivered, cancelled)
    
    // Normalize status: map frontend status to backend format
    if (status) {
      const statusMap: Record<string, string> = {
        'CANCELLED': 'CANCELED', // Map CANCELLED (2 L) to CANCELED (1 L) for backend
        'PENDING': 'PENDING',
        'PROCESSING': 'PROCESSING',
        'DELIVERING': 'DELIVERING',
        'DELIVERED': 'DELIVERED',
        'PAYMENT_RELEASE': 'PAYMENT_RELEASED',
      };
      status = statusMap[status] || status;
    }
    
    // Build query string with all params
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    if (month) queryParams.append('month', month);
    if (year) queryParams.append('year', year);
    if (status) queryParams.append('status', status);
    
    const backendUrl = `${BACKEND_URL}/orders?${queryParams.toString()}`;
    console.log('[API /seller/orders] Proxying GET request to backend:', backendUrl);

    // Build headers for backend request
    const forwardHeaders: Record<string, string> = {
      'Accept': request.headers.get('accept') || 'application/json',
      'Content-Type': 'application/json',
      'Authorization': authHeader,
    };

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: forwardHeaders,
    });

    console.log('[API /seller/orders] Backend response status:', response.status);

    const text = await response.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      data = text;
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: data || 'Failed to fetch seller orders' },
        { status: response.status }
      );
    }

    console.log('[API /seller/orders] Seller orders fetched successfully');
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('[API /seller/orders] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch seller orders' }, { status: 500 });
  }
}
