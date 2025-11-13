import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { email, country, business_name } = body;

    // Validate payload
    if (!email || !country || !business_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const authHeader = getAuthHeader(request);
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const BACKEND_URL = process.env.API_URL || 'http://api.example.com';

    // Simulate backend processing or forward request to external API
    // Example: Forward to external API
    const forwardHeaders: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': authHeader,
    };

    const response = await fetch(`${BACKEND_URL}/vendors/register`, {
      method: 'POST',
      headers: forwardHeaders,
      body: JSON.stringify({ email, country, business_name }),
      cache: 'no-store'
    });

    if (!response.ok) {
      let error;
      try {
        error = await response.json();
      } catch (jsonError) {
        const text = await response.text();
        console.error('Non-JSON error response:', text);
        return NextResponse.json({ error: 'Failed to register vendor: ' + text }, { status: response.status });
      }
      return NextResponse.json({ error: error.message || 'Failed to register vendor' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error in /api/vendors/register:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function getAuthHeader(request: Request): string | undefined {
  const auth = request.headers.get('Authorization');
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7);
  }
  return undefined;
}