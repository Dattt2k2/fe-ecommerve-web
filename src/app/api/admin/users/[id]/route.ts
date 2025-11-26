import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'http://api.example.com';

// GET /api/admin/users/[id] - Get user by ID
export async function GET(
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

    const backendUrl = `${BACKEND_URL}/admin/users/${id}`;
    console.log(`[API /admin/users/${id}] Proxying GET request to backend:`, backendUrl);

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

    console.log(`[API /admin/users/${id}] Backend response status:`, response.status);

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

    console.log(`[API /admin/users/${id}] User fetched successfully`);
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error(`[API /admin/users/${id}] Error:`, error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] - Delete user by ID
export async function DELETE(
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

    const backendUrl = `${BACKEND_URL}/admin/users/${id}`;
    console.log(`[API /admin/users/${id}] Proxying DELETE request to backend:`, backendUrl);

    // Build headers for backend request
    const forwardHeaders: Record<string, string> = {
      'Accept': request.headers.get('accept') || 'application/json',
      'Content-Type': 'application/json',
      'Authorization': authHeader,
    };

    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: forwardHeaders,
    });

    console.log(`[API /admin/users/${id}] Backend response status:`, response.status);

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

    console.log(`[API /admin/users/${id}] User deleted successfully`);
    return NextResponse.json(data || { message: 'User deleted successfully' }, { status: response.status });
  } catch (error: any) {
    console.error(`[API /admin/users/${id}] Error:`, error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

