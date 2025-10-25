import { NextRequest, NextResponse } from 'next/server';

// Mock analytics data
const mockAnalytics = {
  overview: {
    totalUsers: 150,
    totalOrders: 89,
    totalProducts: 45,
    totalRevenue: 1250000000
  },
  revenue: {
    daily: [
      { date: '2023-12-01', amount: 4500000 },
      { date: '2023-12-02', amount: 3200000 },
      { date: '2023-12-03', amount: 5100000 },
      { date: '2023-12-04', amount: 2800000 },
      { date: '2023-12-05', amount: 6200000 },
      { date: '2023-12-06', amount: 4800000 },
      { date: '2023-12-07', amount: 5500000 }
    ],
    monthly: [
      { month: 'Jan', amount: 85000000 },
      { month: 'Feb', amount: 92000000 },
      { month: 'Mar', amount: 78000000 },
      { month: 'Apr', amount: 105000000 },
      { month: 'May', amount: 120000000 },
      { month: 'Jun', amount: 135000000 }
    ]
  },
  products: {
    topSelling: [
      { id: '1', name: 'iPhone 14 Pro', sold: 45, revenue: 1349550000 },
      { id: '2', name: 'Samsung Galaxy S23', sold: 32, revenue: 639680000 },
      { id: '3', name: 'MacBook Air M2', sold: 18, revenue: 521820000 },
      { id: '4', name: 'AirPods Pro 2', sold: 67, revenue: 434830000 },
      { id: '5', name: 'iPad Pro 11', sold: 23, revenue: 505770000 }
    ],
    categories: [
      { name: 'Smartphones', count: 25, revenue: 750000000 },
      { name: 'Laptops', count: 15, revenue: 435000000 },
      { name: 'Tablets', count: 12, revenue: 264000000 },
      { name: 'Audio', count: 8, revenue: 52000000 },
      { name: 'Accessories', count: 5, revenue: 15000000 }
    ]
  },
  customers: {
    new: {
      thisMonth: 25,
      lastMonth: 18,
      growth: 38.9
    },
    returning: {
      thisMonth: 45,
      lastMonth: 52,
      growth: -13.5
    },
    topSpenders: [
      { id: '1', name: 'Nguyễn Văn A', spent: 89970000, orders: 3 },
      { id: '2', name: 'Trần Thị B', spent: 65480000, orders: 4 },
      { id: '3', name: 'Lê Văn C', spent: 52300000, orders: 2 }
    ]
  },
  orders: {
    status: {
      pending: 15,
      processing: 8,
      shipped: 12,
      delivered: 45,
      cancelled: 9
    },
    avgOrderValue: 14157303,
    conversionRate: 2.4
  }
};

// GET /api/admin/analytics - Get detailed analytics
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'month'; // day, week, month, year
    const category = searchParams.get('category');

    let analyticsData = { ...mockAnalytics };    // Filter by period if needed
    if (period === 'day') {
      // For daily view, we'll use daily data
      analyticsData = {
        ...analyticsData,
        revenue: {
          ...analyticsData.revenue,
          // Keep the original monthly data but highlight that we're showing daily
        }
      };
    }

    // Filter by category if needed
    if (category) {
      analyticsData.products.categories = analyticsData.products.categories.filter(
        cat => cat.name.toLowerCase() === category.toLowerCase()
      );
    }

    return NextResponse.json({
      success: true,
      data: analyticsData,
      period,
      category
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Lỗi khi lấy dữ liệu analytics' },
      { status: 500 }
    );
  }
}
