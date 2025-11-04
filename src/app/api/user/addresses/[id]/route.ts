import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'http://api.example.com';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const body = await request.json();

    console.log('[API /user/addresses/:id] Proxying PUT request to backend:', `${BACKEND_URL}/me/addresses/${id}`);

    const forwardHeaders: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': authHeader,
    };

    const response = await fetch(`${BACKEND_URL}/me/addresses/${id}`, {
      method: 'PUT',
      headers: forwardHeaders,
      body: JSON.stringify(body),
    });

    console.log('[API /user/addresses/:id] Backend response status:', response.status);

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

    console.log('[API /user/addresses/:id] Address updated successfully');
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('[API /user/addresses/:id] Error:', error);
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    console.log('[API /user/addresses/:id] Proxying DELETE request to backend:', `${BACKEND_URL}/me/addresses/${id}`);

    const forwardHeaders: Record<string, string> = {
      'Accept': 'application/json',
      'Authorization': authHeader,
    };

    const response = await fetch(`${BACKEND_URL}/me/addresses/${id}`, {
      method: 'DELETE',
      headers: forwardHeaders,
    });

    console.log('[API /user/addresses/:id] Backend response status:', response.status);

    if (!response.ok) {
      const text = await response.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        data = text;
      }
      return NextResponse.json(
        { error: data || 'Upstream error' },
        { status: response.status }
      );
    }

    console.log('[API /user/addresses/:id] Address deleted successfully');
    return NextResponse.json({ message: 'Address deleted successfully' });
  } catch (error: any) {
    console.error('[API /user/addresses/:id] Error:', error);
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
  }
}
