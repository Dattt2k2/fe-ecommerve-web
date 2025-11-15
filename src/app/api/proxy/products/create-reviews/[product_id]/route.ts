import { NextRequest, NextResponse } from 'next/server';

// Use server-only env var like other proxy endpoints (not NEXT_PUBLIC_)
const BACKEND_URL = process.env.API_URL || 'http://api.example.com';

// Re-use the same cookie -> Authorization extraction used across the app
function getAuthHeader(request: NextRequest): string | null {
  let authHeader = request.headers.get('authorization');
  const cookieHeader = request.headers.get('cookie');

  if (!authHeader && cookieHeader) {
    // Accept both auth-token and auth_token cookie names
    const tokenMatch = cookieHeader.match(/auth-token=([^;]+)|auth_token=([^;]+)/);
    if (tokenMatch) {
      const token = tokenMatch[1] || tokenMatch[2];
      if (token) {
        let normalized = token.trim();
        // If cookie already contains a Bearer prefix, use it as-is
        if (/^Bearer\s+/i.test(normalized)) {
          authHeader = normalized;
        } else {
          // Some tokens may be URL encoded in cookie (e.g., "Bearer%20...")
          try { normalized = decodeURIComponent(normalized); } catch (e) {}
          // Remove surrounding quotes if present
          normalized = normalized.replace(/^"|"$/g, '');
          authHeader = `Bearer ${normalized}`;
        }
        // For debugging, log a small token fingerprint without printing full token
        try {
          const fingerprint = normalized.slice(0, 8) + (normalized.length > 8 ? '...' : '');
          console.log('[Proxy create-reviews] token fingerprint:', fingerprint);
        } catch (e) {}
      }
    }
  }

  return authHeader;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ product_id: string }> }) {
  const { product_id } = await params;

  try {
    const reviewData = await request.json();

    const authHeader = getAuthHeader(request);
    // Log incoming headers for debugging authentication issues (redact token for security)
    const cookieHeaderRaw = request.headers.get('cookie') || '';
    const cookieRedacted = cookieHeaderRaw.replace(/auth-token=([^;\s]+)/, 'auth-token=REDACTED');
    console.log('[Proxy create-reviews] Incoming Authorization:', authHeader ? 'present' : 'missing');
    if (authHeader) {
      try {
        const headerToken = authHeader.replace(/^Bearer\s+/i, '');
        const headerFp = headerToken.slice(0, 8) + (headerToken.length > 8 ? '...' : '');
        console.log('[Proxy create-reviews] Authorization header token fingerprint:', headerFp);
      } catch (e) {}
    }
    console.log('[Proxy create-reviews] Incoming Cookie:', cookieRedacted);
    if (!authHeader) {
      // Return 401 like other proxy endpoints when authorization is required
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    console.log('[Proxy] Forwarding create-review to backend:', `${BACKEND_URL}/products/create-reviews/${product_id}`, 'headers:', {
      Authorization: authHeader ? 'present' : 'missing',
      Cookie: cookieHeaderRaw ? 'present' : 'missing'
    });

    const forwardHeaders: Record<string,string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': authHeader,
    };

    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) forwardHeaders['Cookie'] = cookieHeader;

    const response = await fetch(`${BACKEND_URL}/products/create-reviews/${product_id}`, {
      method: 'POST',
      headers: forwardHeaders,
      body: JSON.stringify(reviewData),
    });

    const responseText = await response.text();
    console.log('[Proxy create-reviews] Backend status:', response.status, 'responseText:', responseText);
    let responseData: any = null;
    try {
      responseData = responseText ? JSON.parse(responseText) : null;
    } catch (e) {
      // Backend returned plain text or invalid JSON — forward it as text
      responseData = responseText;
    }

    if (!response.ok) {
      return NextResponse.json({ error: responseData || 'Upstream error' }, { status: response.status });
    }

    return NextResponse.json(responseData, { status: response.status });
  } catch (error: any) {
    console.error('[Proxy create-reviews] Error:', error?.message || error);
    return NextResponse.json({ error: 'Failed to forward request', details: String(error) }, { status: 500 });
  }
}

/**
 * OPTIONS - handle CORS preflight for the review creation endpoint
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}