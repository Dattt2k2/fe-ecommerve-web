'use client';

import { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings,
  Menu,
  X,
  Bell,
  Search,
  Plus,
  TrendingUp,
  DollarSign,
  Package2,
  ShoppingBag
} from 'lucide-react';
import Link from 'next/link';
import { useAdminDashboard } from '@/hooks/useApi';
import { formatPrice } from '@/lib/utils';

interface DashboardStats {
  totalRevenue?: number;
  totalOrders?: number;
  totalProducts?: number;
  totalCustomers?: number;
  revenueChange?: number;
  ordersChange?: number;
  productsChange?: number;
  customersChange?: number;
}

interface DashboardResponse {
  stats?: DashboardStats;
  recentOrders?: any[];
  topProducts?: any[];
}

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Use API hook for dashboard data
  const { 
    data: dashboardData, 
    loading, 
    error 
  } = useAdminDashboard();

  const apiResponse = dashboardData as DashboardResponse;
  const stats = apiResponse?.stats || {};

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { id: 'products', label: 'Sản phẩm', icon: Package, href: '/admin/products' },
    { id: 'orders', label: 'Đơn hàng', icon: ShoppingCart, href: '/admin/orders' },
    { id: 'customers', label: 'Khách hàng', icon: Users, href: '/admin/customers' },
    { id: 'analytics', label: 'Thống kê', icon: BarChart3, href: '/admin/analytics' },
    { id: 'settings', label: 'Cài đặt', icon: Settings, href: '/admin/settings' },
  ];

  const dashboardStats = [
    {
      title: 'Tổng doanh thu',
      value: formatPrice(stats.totalRevenue || 0),
      change: stats.revenueChange ? `${stats.revenueChange > 0 ? '+' : ''}${stats.revenueChange}%` : '+0%',
      changeType: (stats.revenueChange || 0) >= 0 ? 'positive' : 'negative',
      icon: DollarSign,
    },
    {
      title: 'Đơn hàng',
      value: (stats.totalOrders || 0).toLocaleString(),
      change: stats.ordersChange ? `${stats.ordersChange > 0 ? '+' : ''}${stats.ordersChange}%` : '+0%',      changeType: (stats.ordersChange || 0) >= 0 ? 'positive' : 'negative',
      icon: ShoppingBag,
    },
    {
      title: 'Sản phẩm',
      value: (stats.totalProducts || 0).toLocaleString(),
      change: stats.productsChange ? `${stats.productsChange > 0 ? '+' : ''}${stats.productsChange}%` : '+0%',
      changeType: (stats.productsChange || 0) >= 0 ? 'positive' : 'negative',
      icon: Package2,
    },
    {
      title: 'Khách hàng',
      value: (stats.totalCustomers || 0).toLocaleString(),
      change: stats.customersChange ? `${stats.customersChange > 0 ? '+' : ''}${stats.customersChange}%` : '+0%',
      changeType: (stats.customersChange || 0) >= 0 ? 'positive' : 'negative',
      icon: Users,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h3 className="text-red-800 dark:text-red-400 font-medium">Có lỗi xảy ra</h3>
            <p className="text-red-600 dark:text-red-500 mt-2">{error}</p>
          </div>        </div>
      </div>
    );
  }

  const recentOrders = apiResponse?.recentOrders || [
    {
      id: '#ORD-001',
      customer: 'Nguyễn Văn A',
      product: 'iPhone 15 Pro Max',
      amount: '29,990,000₫',
      status: 'pending',
      date: '14/06/2025',
    },
    {
      id: '#ORD-002',
      customer: 'Trần Thị B',
      product: 'MacBook Pro 14"',
      amount: '52,990,000₫',
      status: 'processing',
      date: '14/06/2025',
    },
    {
      id: '#ORD-003',
      customer: 'Lê Văn C',
      product: 'AirPods Pro 2',
      amount: '6,490,000₫',
      status: 'shipped',
      date: '13/06/2025',
    },
    {
      id: '#ORD-004',
      customer: 'Phạm Thị D',
      product: 'Nike Air Max 270',
      amount: '2,899,000₫',
      status: 'delivered',
      date: '13/06/2025',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400';
      case 'processing':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400';
      case 'shipped':
        return 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400';
      case 'delivered':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ xử lý';
      case 'processing':
        return 'Đang xử lý';
      case 'shipped':
        return 'Đã gửi';
      case 'delivered':
        return 'Đã giao';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
              Admin Panel
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === item.id
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="ml-2 text-2xl font-semibold text-gray-900 dark:text-white">
                Dashboard
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <Bell className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">A</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Quick Actions */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-4">
              <Link
                href="/admin/products/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Thêm sản phẩm
              </Link>
              <Link
                href="/admin/orders"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Xem đơn hàng
              </Link>
              <Link
                href="/admin/analytics"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Thống kê
              </Link>
            </div>
          </div>          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {dashboardStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="flex items-center mt-4">
                    <TrendingUp className={`w-4 h-4 mr-1 ${
                      stat.changeType === 'positive' ? 'text-green-500' : 'text-red-500'
                    }`} />
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'positive' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                      so với tháng trước
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Orders */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Đơn hàng gần đây
                </h2>
                <Link
                  href="/admin/orders"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                >
                  Xem tất cả
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Mã đơn
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Khách hàng
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Sản phẩm
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Số tiền
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Trạng thái
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Ngày
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order, index) => (
                    <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-white">
                        {order.id}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">
                        {order.customer}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">
                        {order.product}
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-white">
                        {order.amount}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400">
                        {order.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
