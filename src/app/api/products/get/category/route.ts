import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'http://api.example.com';

// GET /api/products/get/category - Get all categories
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

    // Build headers for backend request
    const forwardHeaders: Record<string, string> = {
      'Accept': request.headers.get('accept') || 'application/json',
      'Content-Type': 'application/json',
    };

    // Add Authorization header if available (optional for public endpoint)
    if (authHeader) {
      forwardHeaders['Authorization'] = authHeader;
    }

    // Call backend endpoint: /products/get/category
    const response = await fetch(`${BACKEND_URL}/products/get/category`, {
      method: 'GET',
      headers: forwardHeaders,
    });

    console.log('[API /products/get/category] Backend response status:', response.status);

    const text = await response.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      data = text;
    }

    if (!response.ok) {
      // For 401, return empty array instead of error (public endpoint)
      if (response.status === 401) {
        console.log('[API /products/get/category] 401 - returning empty array');
        return NextResponse.json({ data: [] }, { status: 200 });
      }
      return NextResponse.json(
        { error: data || 'Upstream error' },
        { status: response.status }
      );
    }

    console.log('[API /products/get/category] Categories fetched successfully');
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('[API /products/get/category] Error:', error);
    // Return empty array on error instead of 500 (public endpoint)
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}

