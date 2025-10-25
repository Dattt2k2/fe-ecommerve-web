import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/types';

// Mock customers data - should be shared with users API
const mockCustomers: User[] = [
  {
    id: '1',
    email: 'admin@shopvn.com',
    name: 'Admin User',
    role: 'admin',
    avatar: '/api/placeholder/100/100'
  },
  {
    id: '2',
    email: 'user@example.com',
    name: 'Test User',
    role: 'user',
    avatar: '/api/placeholder/100/100'
  },
  {
    id: '3',
    email: 'customer1@example.com',
    name: 'Nguyễn Văn A',
    role: 'user'
  },
  {
    id: '4',
    email: 'customer2@example.com',
    name: 'Trần Thị B',
    role: 'user'
  },
  {
    id: '5',
    email: 'customer3@example.com',
    name: 'Lê Văn C',
    role: 'user'
  }
];

// GET /api/admin/customers - Get customer management data
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');

    let filteredCustomers = [...mockCustomers];

    // Filter by search term
    if (search) {
      filteredCustomers = filteredCustomers.filter(customer =>
        customer.name.toLowerCase().includes(search.toLowerCase()) ||
        customer.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by role
    if (role) {
      filteredCustomers = filteredCustomers.filter(customer => customer.role === role);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

    // Add additional customer info (orders, total spent, etc.)
    const enrichedCustomers = paginatedCustomers.map(customer => ({
      ...customer,
      totalOrders: Math.floor(Math.random() * 10) + 1,
      totalSpent: Math.floor(Math.random() * 50000000) + 1000000,
      lastOrderDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: Math.random() > 0.1 ? 'active' : 'inactive'
    }));

    return NextResponse.json({
      success: true,
      customers: enrichedCustomers,
      pagination: {
        page,
        limit,
        total: filteredCustomers.length,
        totalPages: Math.ceil(filteredCustomers.length / limit)
      },
      stats: {
        total: mockCustomers.length,
        active: mockCustomers.filter(c => c.role === 'user').length,
        admins: mockCustomers.filter(c => c.role === 'admin').length
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Lỗi khi lấy dữ liệu khách hàng' },
      { status: 500 }
    );
  }
}
