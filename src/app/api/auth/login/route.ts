import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock user database - trong thực tế sẽ dùng database thật
const users = [
  {
    id: '1',
    email: 'admin@shopvn.com',
    password: '$2a$10$rOmF0Xd.FlEYgdLQ8G3yE.DyJ5.oBjO9.WX1FOGOjq5fOqKJO6ume', // password: admin123
    name: 'Admin',
    role: 'admin'
  },
  {
    id: '2',
    email: 'user@example.com',
    password: '$2a$10$rOmF0Xd.FlEYgdLQ8G3yE.DyJ5.oBjO9.WX1FOGOjq5fOqKJO6ume', // password: admin123
    name: 'User Test',
    role: 'user'
  }
];

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
      const backendResponse = await fetch('http://localhost:8080/auth/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': 'http://localhost:3000',
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
        
        // Create a NextResponse with the data from the backend
        const response = NextResponse.json({
          success: true,
          ...responseData,
          uid: responseData.id || responseData.uid, // Ensure UID is available
          role: responseData.role || 'user', // Ensure role is available
        });
        
        // Set auth token in cookie
        if (responseData.access_token) {
          response.cookies.set('auth-token', responseData.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 // 7 days
          });
        }
        
        return response;
      }
      
      // If backend returned error, check if it's 404 (not found) or other
      // Don't fall back to mock for 401 (unauthorized) or other errors
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
      
      // Fall through to mock only if backend is not available (404)
      console.log('Backend not available, using mock data');
    } catch (backendError) {
      console.log('Error connecting to backend:', backendError);
      // Fall through to mock implementation
    }
    
    // MOCK IMPLEMENTATION - only used if backend is not available
    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không đúng' },
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không đúng' },
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );
    
    // Mock access token response format similar to backend
    const mockResponse = {
      success: true,
      access_token: token,
      refresh_token: token, // Using same token for simplicity in mock
      uid: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      // Additional fields to match backend response format
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    };

    // Create response with CORS headers
    const response = NextResponse.json(mockResponse, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;

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
