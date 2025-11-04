import { NextRequest, NextResponse } from 'next/server';

// Mock customers data
const mockCustomers = [
  {
    id: '1',
    name: 'Nguyễn Văn A',
    email: 'nguyenvana@email.com',
    phone: '0123456789',
    status: 'active',
    totalOrders: 15,
    totalSpent: 2500000,
    createdAt: '2024-01-15',
    role: 'customer'
  },
  {
    id: '2',
    name: 'Trần Thị B',
    email: 'tranthib@email.com',
    phone: '0987654321',
    status: 'active',
    totalOrders: 8,
    totalSpent: 1200000,
    createdAt: '2024-02-20',
    role: 'customer'
  },
  {
    id: '3',
    name: 'Lê Văn C',
    email: 'levanc@email.com',
    status: 'inactive',
    totalOrders: 3,
    totalSpent: 450000,
    createdAt: '2024-03-10',
    role: 'customer'
  }
];

// PUT /api/admin/customers/[id] - Update customer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updateData = await request.json();


    // Find customer
    const customerIndex = mockCustomers.findIndex(c => c.id === id);
    if (customerIndex === -1) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Update customer
    mockCustomers[customerIndex] = {
      ...mockCustomers[customerIndex],
      ...updateData
    };

    return NextResponse.json({
      message: 'Customer updated successfully',
      user: mockCustomers[customerIndex]
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/customers/[id] - Delete customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;


    // Find customer
    const customerIndex = mockCustomers.findIndex(c => c.id === id);
    if (customerIndex === -1) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Remove customer
    const deletedCustomer = mockCustomers.splice(customerIndex, 1)[0];

    return NextResponse.json({
      message: 'Customer deleted successfully',
      user: deletedCustomer
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}

// GET /api/admin/customers/[id] - Get single customer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;


    // Find customer
    const customer = mockCustomers.find(c => c.id === id);
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      customer
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get customer' },
      { status: 500 }
    );
  }
}
