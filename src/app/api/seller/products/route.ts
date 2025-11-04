import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'http://api.example.com';

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

    console.log('[API /seller/products] Proxying GET request to backend:', `${BACKEND_URL}/seller/products`);

    // Build headers for backend request
    const forwardHeaders: Record<string, string> = {
      'Accept': request.headers.get('accept') || 'application/json',
      'Content-Type': 'application/json',
      'Authorization': authHeader,
    };

    const response = await fetch(`${BACKEND_URL}/seller/products`, {
      method: 'GET',
      headers: forwardHeaders,
    });

    console.log('[API /seller/products] Backend response status:', response.status);

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

    console.log('[API /seller/products] Products fetched successfully');
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('[API /seller/products] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

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

    const body = await request.json();

    console.log('[API /seller/products] Proxying POST request to backend:', `${BACKEND_URL}/seller/products`);

    const forwardHeaders: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': authHeader,
    };

    const response = await fetch(`${BACKEND_URL}/seller/products`, {
      method: 'POST',
      headers: forwardHeaders,
      body: JSON.stringify(body),
    });

    console.log('[API /seller/products] Backend response status:', response.status);

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

    console.log('[API /seller/products] Product created successfully');
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('[API /seller/products] Error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
