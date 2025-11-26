import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'http://api.example.com';

function getAuthHeader(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  return authHeader;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const queryParams: string[] = [];
    
    const paramsToForward = ['page', 'limit', 'category', 'sortBy', 'sortOrder', 'search', 'minPrice', 'maxPrice'];
    paramsToForward.forEach(param => {
      const value = searchParams.get(param);
      if (value) {
        queryParams.push(`${param}=${encodeURIComponent(value)}`);
      }
    });
    
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    const endpoint = `/search/advanced${queryString}`;
        
    const forwardHeaders: Record<string, string> = {
      'Accept': 'application/json',
    };

    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'GET',
      headers: forwardHeaders,
      cache: 'no-store'
    });

    // Handle errors
    if (!response.ok) {
      console.error(`[SearchAdvancedAPI] Backend returned error status: ${response.status}`);
      return NextResponse.json(
        { error: `Backend returned status: ${response.status}` },
        { status: response.status }
      );
    }

    // Return data from backend
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error(`[SearchAdvancedAPI] Error: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    );
  }
}

