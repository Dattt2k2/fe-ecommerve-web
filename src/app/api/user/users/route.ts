import { NextRequest, NextResponse } from 'next/server';

// Use a server-only env var (do NOT prefix with NEXT_PUBLIC_)
const BACKEND_URL = process.env.API_URL || 'http://api.example.com';

export async function GET(request: NextRequest) {
  try {
    // Accept either Authorization header or cookies (some backends use session cookie)
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');

    if (!authHeader && !cookieHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    console.log('[API /users] Proxying request to backend:', `${BACKEND_URL}/users`);

    // Build headers for backend request
    const forwardHeaders: Record<string, string> = {
      'Accept': request.headers.get('accept') || 'application/json',
      'Content-Type': 'application/json',
    };

    if (authHeader) forwardHeaders['Authorization'] = authHeader;
    if (cookieHeader) forwardHeaders['Cookie'] = cookieHeader;

    const response = await fetch(`${BACKEND_URL}/users`, {
      method: 'GET',
      headers: forwardHeaders,
      // If you want to ensure this fetch uses the Node runtime instead of the Edge runtime,
      // you'd control it via route config; for most cases this is fine.
    });

    console.log('[API /users] Backend response status:', response.status);

    // Try to parse JSON, but handle non-JSON responses gracefully
    const text = await response.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      // backend returned non-JSON (e.g., plain text); forward as text
      data = text;
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: data || 'Upstream error' },
        { status: response.status }
      );
    }

    console.log('[API /users] User profile fetched successfully');
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('[API /users] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}
