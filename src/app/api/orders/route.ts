import { NextRequest, NextResponse } from 'next/server';
import { Order } from '@/types';

// Mock orders database
let orders: Order[] = [
  {
    id: '1',
    userId: '1',
    items: [
      {
        id: '1',
        product: {
          id: '1',
          name: 'iPhone 14 Pro',
          description: 'Apple iPhone 14 Pro với camera 48MP, chip A16 Bionic',
          price: 29990000,
          originalPrice: 32990000,
          category: 'smartphones',
          image: '/api/placeholder/300/300',
          stock: 10,
          rating: 4.8,
          reviews: 120,
          tags: ['hot', 'sale']
        },
        quantity: 1
      }
    ],
    total: 29990000,    status: 'delivered',
    shippingAddress: {
      id: '1',
      name: 'Nguyễn Văn A',
      street: '123 Đường ABC',
      city: 'TP.HCM',
      state: 'TP.HCM',
      zipCode: '700000',      country: 'Vietnam'
    },
    createdAt: new Date('2023-12-01T10:00:00Z'),
    updatedAt: new Date('2023-12-01T10:30:00Z')
  },
  {
    id: '2',
    userId: '2',
    items: [
      {
        id: '2',
        product: {
          id: '2',
          name: 'Samsung Galaxy S23',
          description: 'Samsung Galaxy S23 với camera 50MP, chip Snapdragon 8 Gen 2',
          price: 19990000,
          originalPrice: 22990000,
          category: 'smartphones',
          image: '/api/placeholder/300/300',
          stock: 15,
          rating: 4.7,
          reviews: 89,
          tags: ['new']
        },
        quantity: 1
      }
    ],
    total: 19990000,
    status: 'pending',
    shippingAddress: {
      id: '2',
      name: 'Trần Thị B',
      street: '456 Đường XYZ',
      city: 'Hà Nội',
      state: 'Hà Nội',      zipCode: '100000',
      country: 'Vietnam'
    },
    createdAt: new Date('2023-12-02T14:00:00Z'),
    updatedAt: new Date('2023-12-02T14:00:00Z')
  }
];

// GET /api/orders - Get all orders (admin) or user orders
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');

    let filteredOrders = [...orders];

    // Filter by user ID if provided
    if (userId) {
      filteredOrders = filteredOrders.filter(order => order.userId === userId);
    }

    // Filter by status if provided
    if (status) {
      filteredOrders = filteredOrders.filter(order => order.status === status);
    }

    // Sort by created date (newest first)
    filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    return NextResponse.json({
      orders: paginatedOrders,
      pagination: {
        page,
        limit,
        total: filteredOrders.length,
        totalPages: Math.ceil(filteredOrders.length / limit)
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Lỗi khi lấy danh sách đơn hàng' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json();

    // Validate required fields
    if (!orderData.userId || !orderData.items || !orderData.total || !orderData.shippingAddress) {
      return NextResponse.json(
        { error: 'Thiếu thông tin đơn hàng bắt buộc' },
        { status: 400 }
      );
    }

    // Create new order
    const newOrder: Order = {
      id: (orders.length + 1).toString(),
      userId: orderData.userId,
      items: orderData.items,      total: orderData.total,
      status: 'pending',
      shippingAddress: orderData.shippingAddress,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    orders.push(newOrder);

    return NextResponse.json({
      message: 'Tạo đơn hàng thành công',
      order: newOrder
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Lỗi khi tạo đơn hàng' },
      { status: 500 }
    );
  }
}
