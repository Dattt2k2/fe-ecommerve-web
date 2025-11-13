import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'http://api.example.com';

export async function POST(request: NextRequest) {
  try {
    // Get the input credentials
    const data = await request.json();
    const { 'refresh_token': refreshToken } = data;

    // Validate input
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token là bắt buộc' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }

    // Try external backend first (if in production or on development with real backend)
    try {
      // Call the actual backend API
      const backendResponse = await fetch(`${BACKEND_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '/*',
          // 'Origin': 'http://localhost:3000',
        },
        body: JSON.stringify({
          refreshToken
        }),
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
      });
      
      // If we got a response from the backend, use it
      if (backendResponse.ok) {
        const responseData = await backendResponse.json();
        
        const response = NextResponse.json({
          success: true,
          ...responseData,
          uid: responseData.id || responseData.uid, 
          role: responseData.role || 'user', 
        });
        
        return response;
      }
      if (backendResponse.status !== 404) {
        const errorData = await backendResponse.json();
        return NextResponse.json(
          errorData, 
          { 
            status: backendResponse.status,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
          }
        );
      }
    } catch (backendError) {
      console.log('Error connecting to backend:', backendError);
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Lỗi server nội bộ' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );
  }
}

// Add OPTIONS handler for CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With',
      'Access-Control-Max-Age': '86400'
    }
  });
}
