import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'http://api.example.com';

// GET /api/admin/users - Get all users
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
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    
    // Build query string with all params
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    if (search) queryParams.append('search', search);
    if (status) queryParams.append('status', status);
    
    const backendUrl = `${BACKEND_URL}/admin/users?${queryParams.toString()}`;
    console.log('[API /admin/users] Proxying GET request to backend:', backendUrl);

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

    console.log('[API /admin/users] Backend response status:', response.status);

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

    console.log('[API /admin/users] Users fetched successfully');
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('[API /admin/users] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

