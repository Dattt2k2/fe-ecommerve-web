import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'http://api.example.com';

export async function POST(request: NextRequest) {
  try {
    // Get the input credentials
    const data = await request.json();
    const { email, password } = data;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email và mật khẩu là bắt buộc' },
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
      const backendResponse = await fetch(`${BACKEND_URL}/auth/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '/*',
          // 'Origin': 'http://localhost:3000',
        },
        body: JSON.stringify({
          email,
          password
        }),
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
      });
      
      // If we got a response from the backend, use it
      if (backendResponse.ok) {
        const responseData = await backendResponse.json();
        try {
          const t = responseData.access_token || responseData.token || responseData.auth_token;
          if (t) {
            const fingerprint = (typeof t === 'string' ? (t.slice(0, 8) + (t.length > 8 ? '...' : '')) : 'non-string');
            console.log('[Auth Login] backend response contains token fingerprint:', fingerprint);
          } else {
            console.log('[Auth Login] backend response contains no token');
          }
        } catch (e) { /* ignore */ }
        
        // Map user_type to role for frontend compatibility
        const userType = responseData.user_type || responseData.role || 'USER';
        const role = userType.toLowerCase();
        
        const response = NextResponse.json({
          success: true,
          ...responseData,
          uid: responseData.user_id || responseData.id || responseData.uid, 
          role: role, // Map user_type to role
          user_type: userType, // Keep original for reference
        });
        
        // Set auth token in cookie
        if (responseData.access_token) {
          response.cookies.set('auth-token', responseData.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 
          });
        }
        
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
