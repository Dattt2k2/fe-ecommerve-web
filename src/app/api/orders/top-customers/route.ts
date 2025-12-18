import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'http://api.example.com';

// GET /api/orders/top-customers - Get top customers
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

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '10';
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    
    let backendUrl = `${BACKEND_URL}/orders/top-customers`;
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit);
    if (month) queryParams.append('month', month);
    if (year) queryParams.append('year', year);
    if (queryParams.toString()) {
      backendUrl += `?${queryParams.toString()}`;
    }
    
    console.log('[API /orders/top-customers] Proxying GET request to backend:', backendUrl);

    const forwardHeaders: Record<string, string> = {
      'Accept': request.headers.get('accept') || 'application/json',
      'Content-Type': 'application/json',
      'Authorization': authHeader,
    };

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: forwardHeaders,
    });

    console.log('[API /orders/top-customers] Backend response status:', response.status);

    const text = await response.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      data = text;
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: data || 'Upstream error' },
        { status: response.status }
      );
    }

    console.log('[API /orders/top-customers] Top customers fetched successfully');
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('[API /orders/top-customers] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch top customers' }, { status: 500 });
  }
}

