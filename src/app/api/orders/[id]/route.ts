import { NextRequest, NextResponse } from 'next/server';
import { Order } from '@/types';

// Mock orders database - should be shared with main route
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
    total: 29990000,
    status: 'delivered',
    shippingAddress: {
      id: '1',
      name: 'Nguyễn Văn A',
      street: '123 Đường ABC',
      city: 'TP.HCM',
      state: 'TP.HCM',
      zipCode: '700000',
      country: 'Vietnam'
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
      state: 'Hà Nội',
      zipCode: '100000',
      country: 'Vietnam'
    },
    createdAt: new Date('2023-12-02T14:00:00Z'),
    updatedAt: new Date('2023-12-02T14:00:00Z')
  }
];

// GET /api/orders/[id] - Get order by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const order = orders.find(o => o.id === id);
    if (!order) {
      return NextResponse.json(
        { error: 'Không tìm thấy đơn hàng' },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json(
      { error: 'Lỗi khi lấy thông tin đơn hàng' },
      { status: 500 }
    );
  }
}

// PUT /api/orders/[id] - Update order status (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { status } = await request.json();

    const orderIndex = orders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      return NextResponse.json(
        { error: 'Không tìm thấy đơn hàng' },
        { status: 404 }
      );
    }

    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Trạng thái đơn hàng không hợp lệ' },
        { status: 400 }
      );
    }

    // Update order status
    orders[orderIndex] = {
      ...orders[orderIndex],
      status,
      updatedAt: new Date()
    };

    return NextResponse.json({
      message: 'Cập nhật trạng thái đơn hàng thành công',
      order: orders[orderIndex]
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Lỗi khi cập nhật đơn hàng' },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/[id] - Cancel order
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const orderIndex = orders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      return NextResponse.json(
        { error: 'Không tìm thấy đơn hàng' },
        { status: 404 }
      );
    }

    // Check if order can be cancelled
    const order = orders[orderIndex];
    if (order.status === 'delivered' || order.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Không thể hủy đơn hàng này' },
        { status: 400 }
      );
    }

    // Cancel order
    orders[orderIndex] = {
      ...order,
      status: 'cancelled',
      updatedAt: new Date()
    };

    return NextResponse.json({
      message: 'Hủy đơn hàng thành công',
      order: orders[orderIndex]
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Lỗi khi hủy đơn hàng' },
      { status: 500 }
    );
  }
}
