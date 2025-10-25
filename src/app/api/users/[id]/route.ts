import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/types';

// Mock users database - should be shared with main route
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

// GET /api/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const user = users.find(u => u.id === id);
    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy người dùng' },
        { status: 404 }
      );
    }

    // Return user without sensitive data
    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar
    };

    return NextResponse.json({ user: safeUser });
  } catch (error) {
    return NextResponse.json(
      { error: 'Lỗi khi lấy thông tin người dùng' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const userData = await request.json();

    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'Không tìm thấy người dùng' },
        { status: 404 }
      );
    }

    // Update user (exclude sensitive fields)
    const updatedUser: User = {
      ...users[userIndex],
      name: userData.name || users[userIndex].name,
      avatar: userData.avatar || users[userIndex].avatar,
      // Don't allow role change for regular users
      role: userData.role && users[userIndex].role === 'admin' ? userData.role : users[userIndex].role
    };

    users[userIndex] = updatedUser;

    // Return user without sensitive data
    const safeUser = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      avatar: updatedUser.avatar
    };

    return NextResponse.json({
      message: 'Cập nhật thông tin thành công',
      user: safeUser
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Lỗi khi cập nhật thông tin người dùng' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'Không tìm thấy người dùng' },
        { status: 404 }
      );
    }

    // Don't allow deleting admin users
    if (users[userIndex].role === 'admin') {
      return NextResponse.json(
        { error: 'Không thể xóa tài khoản admin' },
        { status: 403 }
      );
    }

    // Remove user
    users.splice(userIndex, 1);

    return NextResponse.json({
      message: 'Xóa người dùng thành công'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Lỗi khi xóa người dùng' },
      { status: 500 }
    );
  }
}
