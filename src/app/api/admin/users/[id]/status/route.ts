import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'http://api.example.com';

// PATCH /api/admin/users/[id]/status - Update user status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

    // Get request body
    const body = await request.json();
    const { is_disabled } = body;

    const backendUrl = `${BACKEND_URL}/admin/users/${id}/status`;
    console.log(`[API /admin/users/${id}/status] Proxying PATCH request to backend:`, backendUrl);

    // Build headers for backend request
    const forwardHeaders: Record<string, string> = {
      'Accept': request.headers.get('accept') || 'application/json',
      'Content-Type': 'application/json',
      'Authorization': authHeader,
    };

    const response = await fetch(backendUrl, {
      method: 'PATCH',
      headers: forwardHeaders,
      body: JSON.stringify({ is_disabled }),
    });

    console.log(`[API /admin/users/${id}/status] Backend response status:`, response.status);

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

    console.log(`[API /admin/users/${id}/status] User status updated successfully`);
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error(`[API /admin/users/${id}/status] Error:`, error);
    return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
  }
}

