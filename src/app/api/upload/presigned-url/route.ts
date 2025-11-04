import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'http://api.example.com';

// Helper function to get auth header
function getAuthHeader(request: NextRequest): string | null {
  let authHeader = request.headers.get('authorization');
  const cookieHeader = request.headers.get('cookie');

  if (!authHeader && cookieHeader) {
    const tokenMatch = cookieHeader.match(/auth-token=([^;]+)/);
    if (tokenMatch) {
      authHeader = `Bearer ${tokenMatch[1]}`;
    }
  }

  return authHeader;
}

/**
 * POST - Lấy presigned URL từ backend để upload ảnh
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = getAuthHeader(request);
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const body = await request.json();
    
    console.log(`[UploadAPI] Forwarding POST request to backend: /upload/presigned-url`);
    
    const forwardHeaders: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': authHeader,
    };

    const response = await fetch(`${BACKEND_URL}/upload/presigned-url`, {
      method: 'POST',
      headers: forwardHeaders,
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error(`[UploadAPI] Backend returned error status on POST: ${response.status}`);
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || `Backend returned status: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
    
  } catch (error) {
    console.error(`[UploadAPI] Error: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json(
      { error: 'Failed to get presigned URL' },
      { status: 500 }
    );
  }
}