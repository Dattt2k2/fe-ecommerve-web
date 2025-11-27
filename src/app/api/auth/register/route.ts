import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'http://api.example.com';

export async function POST(request: NextRequest) {
  try {
    // Get the input data
    const data = await request.json();
    console.log('[API /auth/register] Received data:', data);
    const { email, password, phone, first_name, name, confirmPassword } = data;
    
    // Sử dụng first_name nếu có, nếu không thì dùng name (tương thích ngược)
    const userName = first_name || name;
    console.log('[API /auth/register] Using name field:', userName);

    // Validate input
    if (!email || !password || !userName || !phone) {
      return NextResponse.json(
        { error: 'Tất cả các trường là bắt buộc' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    // Chỉ kiểm tra confirmPassword nếu có gửi lên
    if (confirmPassword && password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Mật khẩu xác nhận không khớp' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu phải có ít nhất 6 ký tự' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    // Call the backend API
    const backendPayload = { email, password, phone, first_name: userName };
    console.log('[API /auth/register] Sending to backend:', backendPayload);
    
    const backendResponse = await fetch(`${BACKEND_URL}/auth/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': '/*',
      },
      body: JSON.stringify(backendPayload),
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
    });

    // If backend responds successfully
    if (backendResponse.ok) {
      const responseData = await backendResponse.json();

      const response = NextResponse.json({
        success: true,
        ...responseData,
      });

      // Set auth token in cookie
      if (responseData.access_token) {
        response.cookies.set('auth-token', responseData.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60, // 7 days
        });
      }

      return response;
    }

    // If backend responds with an error
    const errorData = await backendResponse.json();
    return NextResponse.json(
      errorData,
      {
        status: backendResponse.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Lỗi server nội bộ' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
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
      'Access-Control-Max-Age': '86400',
    },
  });
}