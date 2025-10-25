import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/types';

// Mock users database - shared with auth routes
let users: User[] = [
  {
    id: '1',
    email: 'admin@shopvn.com',
    name: 'Admin User',
    role: 'admin'
  },
  {
    id: '2',
    email: 'user@example.com',
    name: 'Test User',
    role: 'user'
  }
];

// GET /api/users - Get all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');

    let filteredUsers = [...users];

    // Filter by role if provided
    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }

    // Remove sensitive data
    const safeUsers = filteredUsers.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar
    }));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = safeUsers.slice(startIndex, endIndex);

    return NextResponse.json({
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total: filteredUsers.length,
        totalPages: Math.ceil(filteredUsers.length / limit)
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Lỗi khi lấy danh sách người dùng' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create new user (admin only)
export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();

    // Validate required fields
    if (!userData.email || !userData.name) {
      return NextResponse.json(
        { error: 'Email và tên là bắt buộc' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = users.find(u => u.email === userData.email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email đã được sử dụng' },
        { status: 409 }
      );
    }

    // Create new user
    const newUser: User = {
      id: (users.length + 1).toString(),
      email: userData.email,
      name: userData.name,
      role: userData.role || 'user',
      avatar: userData.avatar
    };

    users.push(newUser);

    // Return user without sensitive data
    const safeUser = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      avatar: newUser.avatar
    };

    return NextResponse.json({
      message: 'Tạo người dùng thành công',
      user: safeUser
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Lỗi khi tạo người dùng' },
      { status: 500 }
    );
  }
}
