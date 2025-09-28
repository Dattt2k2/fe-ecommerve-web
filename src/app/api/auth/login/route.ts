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
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email và mật khẩu là bắt buộc' },
        { status: 400 }
      );
    }

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
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

    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
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
      { status: 500 }
    );
  }
}
