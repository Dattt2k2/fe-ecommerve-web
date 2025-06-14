'use client';

import { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  Calendar,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueGrowth: number;
  orderGrowth: number;
  customerGrowth: number;
  productGrowth: number;
}

interface ChartData {
  name: string;
  value: number;
  growth?: number;
}

// Mock analytics data
const mockAnalyticsData: AnalyticsData = {
  totalRevenue: 125000000,
  totalOrders: 1250,
  totalCustomers: 890,
  totalProducts: 156,
  revenueGrowth: 12.5,
  orderGrowth: 8.3,
  customerGrowth: 15.2,
  productGrowth: 5.7
};

const monthlyRevenue: ChartData[] = [
  { name: 'Tháng 1', value: 8500000 },
  { name: 'Tháng 2', value: 9200000 },
  { name: 'Tháng 3', value: 11000000 },
  { name: 'Tháng 4', value: 10800000 },
  { name: 'Tháng 5', value: 12500000 },
  { name: 'Tháng 6', value: 13200000 },
  { name: 'Tháng 7', value: 14000000 },
  { name: 'Tháng 8', value: 13500000 },
  { name: 'Tháng 9', value: 15000000 },
  { name: 'Tháng 10', value: 16200000 },
  { name: 'Tháng 11', value: 17500000 },
  { name: 'Tháng 12', value: 18800000 }
];

const topProducts: ChartData[] = [
  { name: 'iPhone 15 Pro', value: 25000000 },
  { name: 'MacBook Air M2', value: 22000000 },
  { name: 'Samsung Galaxy S24', value: 18000000 },
  { name: 'iPad Air', value: 15000000 },
  { name: 'AirPods Pro', value: 12000000 }
];

const topCategories: ChartData[] = [
  { name: 'Điện thoại', value: 45 },
  { name: 'Laptop', value: 25 },
  { name: 'Tablet', value: 15 },
  { name: 'Phụ kiện', value: 10 },
  { name: 'Khác', value: 5 }
];

export default function AnalyticsManagement() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [analytics] = useState<AnalyticsData>(mockAnalyticsData);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  const GrowthIcon = ({ growth }: { growth: number }) => {
    return growth >= 0 ? 
      <TrendingUp className="h-4 w-4" /> : 
      <TrendingDown className="h-4 w-4" />;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Phân tích thống kê</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Theo dõi hiệu suất kinh doanh và xu hướng phát triển
        </p>
      </div>

      {/* Time Range Filter */}
      <div className="mb-6">
        <div className="flex space-x-2">
          {[
            { value: '7d', label: '7 ngày' },
            { value: '30d', label: '30 ngày' },
            { value: '90d', label: '90 ngày' },
            { value: '1y', label: '1 năm' }
          ].map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Doanh thu</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatCurrency(analytics.totalRevenue)}
              </p>
              <div className={`flex items-center mt-2 text-sm ${getGrowthColor(analytics.revenueGrowth)}`}>
                <GrowthIcon growth={analytics.revenueGrowth} />
                <span className="ml-1">{Math.abs(analytics.revenueGrowth)}%</span>
              </div>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Đơn hàng</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatNumber(analytics.totalOrders)}
              </p>
              <div className={`flex items-center mt-2 text-sm ${getGrowthColor(analytics.orderGrowth)}`}>
                <GrowthIcon growth={analytics.orderGrowth} />
                <span className="ml-1">{Math.abs(analytics.orderGrowth)}%</span>
              </div>
            </div>
            <ShoppingCart className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Khách hàng</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatNumber(analytics.totalCustomers)}
              </p>
              <div className={`flex items-center mt-2 text-sm ${getGrowthColor(analytics.customerGrowth)}`}>
                <GrowthIcon growth={analytics.customerGrowth} />
                <span className="ml-1">{Math.abs(analytics.customerGrowth)}%</span>
              </div>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sản phẩm</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatNumber(analytics.totalProducts)}
              </p>
              <div className={`flex items-center mt-2 text-sm ${getGrowthColor(analytics.productGrowth)}`}>
                <GrowthIcon growth={analytics.productGrowth} />
                <span className="ml-1">{Math.abs(analytics.productGrowth)}%</span>
              </div>
            </div>
            <Package className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Revenue Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Doanh thu theo tháng</h3>
            <LineChart className="h-5 w-5 text-gray-500" />
          </div>
          <div className="space-y-3">
            {monthlyRevenue.slice(-6).map((month) => (
              <div key={month.name} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{month.name}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(month.value / Math.max(...monthlyRevenue.map(m => m.value))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white min-w-20 text-right">
                    {formatCurrency(month.value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sản phẩm bán chạy</h3>
            <BarChart3 className="h-5 w-5 text-gray-500" />
          </div>
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-6">
                    #{index + 1}
                  </span>
                  <span className="text-sm text-gray-900 dark:text-white ml-2">{product.name}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(product.value / Math.max(...topProducts.map(p => p.value))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white min-w-20 text-right">
                    {formatCurrency(product.value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Distribution & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Phân bố danh mục</h3>
            <PieChart className="h-5 w-5 text-gray-500" />
          </div>
          <div className="space-y-3">
            {topCategories.map((category, index) => {
              const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
              return (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${colors[index]} mr-3`}></div>
                    <span className="text-sm text-gray-900 dark:text-white">{category.name}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${colors[index]}`}
                        style={{ width: `${category.value}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white min-w-12 text-right">
                      {category.value}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Thống kê nhanh</h3>
            <Calendar className="h-5 w-5 text-gray-500" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Đơn hàng hôm nay</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">24</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Doanh thu hôm nay</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(2500000)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Khách hàng mới</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">12</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Tỷ lệ chuyển đổi</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">3.2%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Giá trị đơn trung bình</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(980000)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sản phẩm hết hàng</span>
              <span className="text-sm font-medium text-red-600 dark:text-red-400">5</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
