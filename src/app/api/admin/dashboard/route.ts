import { NextRequest, NextResponse } from 'next/server';

// Mock analytics data
const mockAnalytics = {
  totalUsers: 150,
  totalOrders: 89,
  totalProducts: 45,
  totalRevenue: 1250000000,
  monthlyRevenue: [
    { month: 'Jan', revenue: 85000000 },
    { month: 'Feb', revenue: 92000000 },
    { month: 'Mar', revenue: 78000000 },
    { month: 'Apr', revenue: 105000000 },
    { month: 'May', revenue: 120000000 },
    { month: 'Jun', revenue: 135000000 }
  ],
  topCategories: [
    { name: 'Smartphones', count: 25, percentage: 35 },
    { name: 'Laptops', count: 15, percentage: 25 },
    { name: 'Tablets', count: 12, percentage: 20 },
    { name: 'Audio', count: 8, percentage: 15 },
    { name: 'Accessories', count: 5, percentage: 5 }
  ],
  recentOrders: [
    {
      id: '1',
      customerName: 'Nguyễn Văn A',
      total: 29990000,
      status: 'delivered',
      date: '2023-12-01'
    },
    {
      id: '2',
      customerName: 'Trần Thị B',
      total: 19990000,
      status: 'pending',
      date: '2023-12-02'
    }
  ],
  salesTrend: {
    thisMonth: 135000000,
    lastMonth: 120000000,
    growth: 12.5
  }
};

// GET /api/admin/dashboard - Get dashboard analytics
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: mockAnalytics
    });
  } catch (error) {
    console.error('Error in admin dashboard API:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy dữ liệu dashboard' },
      { status: 500 }
    );
  }
}
