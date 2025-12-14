'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Package,
  ArrowLeft,
  Download,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  MapPin,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { Order, Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { apiClient } from '@/lib/apiClient';
import { apiClient as apiClientMain } from '@/lib/api';

// Mock orders data
const mockOrders: (Order & { customerName: string; customerEmail: string })[] = [
  {
    id: 'ORD-001',
    userId: '1',
    customerName: 'Nguyễn Văn A',
    customerEmail: 'nguyenvana@email.com',
    items: [
      {
        id: '1',
        product: {
          id: '1',
          name: 'iPhone 15 Pro Max',
          description: 'Điện thoại thông minh cao cấp',
          price: 29990000,
          category: 'electronics',
          image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop',
          stock: 50,
          rating: 4.8,
          reviews: 125,
        },
        quantity: 1,
        size: undefined,
        color: undefined,
      },
    ],
    total: 29990000,
    status: 'pending',
    shippingAddress: {
      id: '1',
      name: 'Nguyễn Văn A',
      street: '123 Đường ABC',
      city: 'TP.HCM',
      state: 'TP.HCM',
      zipCode: '70000',
      country: 'Việt Nam',
    },
    createdAt: new Date('2025-06-14'),
    updatedAt: new Date('2025-06-14'),
  },
  {
    id: 'ORD-002',
    userId: '2',
    customerName: 'Trần Thị B',
    customerEmail: 'tranthib@email.com',
    items: [
      {
        id: '2',
        product: {
          id: '2',
          name: 'MacBook Pro 14"',
          description: 'Laptop chuyên nghiệp',
          price: 52990000,
          category: 'electronics',
          image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=400&fit=crop',
          stock: 25,
          rating: 4.9,
          reviews: 89,
        },
        quantity: 1,
        size: undefined,
        color: undefined,
      },
    ],
    total: 52990000,
    status: 'processing',
    shippingAddress: {
      id: '2',
      name: 'Trần Thị B',
      street: '456 Đường DEF',
      city: 'Hà Nội',
      state: 'Hà Nội',
      zipCode: '10000',
      country: 'Việt Nam',
    },
    createdAt: new Date('2025-06-13'),
    updatedAt: new Date('2025-06-14'),
  },
  // Add more mock orders...
];

interface AdminOrder {
  id: string;
  userId: string;
  customerName?: string;
  customerEmail?: string;
  items: Array<{
    productId?: string;
    ProductID?: string;
    quantity: number;
    Quantity?: number;
    price: number;
    Price?: number;
    name?: string;
    Name?: string;
    variant_id?: string;
    variantId?: string;
    size?: string;
    Size?: string;
    color?: string;
    Color?: string;
  }>;
  total: number;
  TotalPrice?: number;
  status: string;
  Status?: string;
  PaymentStatus?: string;
  ShippingStatus?: string;
  shippingAddress?: string;
  ShippingAddress?: string;
  createdAt: Date | string;
  CreatedAt?: string;
  updatedAt: Date | string;
  UpdatedAt?: string;
}

export default function OrderManagement() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    orderId: string;
    newStatus: string;
    oldStatus: string;
  } | null>(null);

  // Normalize status from backend format to frontend format
  const normalizeStatus = (s: any): string => {
    if (!s && s !== 0) return 'pending';
    const raw = String(s).toLowerCase();
    // Normalize common variants
    if (raw === 'canceled' || raw === 'cancelled') return 'canceled';
    // Map payment release variants
    if (raw.includes('release') || raw === 'payment_released' || raw === 'released') return 'payment_release';
    // Map shipping statuses
    if (raw === 'pending' || raw === 'payment_held' || raw === 'held') return 'pending';
    if (raw === 'processing') return 'processing';
    if (raw === 'delivering' || raw === 'shipping' || raw === 'in_transit' || raw === 'in-transit') return 'shipped';
    if (raw === 'shipped') return 'shipped';
    if (raw === 'delivered' || raw === 'completed') return 'delivered';
    // If uppercase, convert and try again
    const upperRaw = String(s).toUpperCase();
    if (upperRaw === 'PENDING' || upperRaw === 'PAYMENT_HELD') return 'pending';
    if (upperRaw === 'PROCESSING') return 'processing';
    if (upperRaw === 'DELIVERING' || upperRaw === 'SHIPPING' || upperRaw === 'IN_TRANSIT') return 'shipped';
    if (upperRaw === 'SHIPPED') return 'shipped';
    if (upperRaw === 'DELIVERED' || upperRaw === 'COMPLETED') return 'delivered';
    if (upperRaw === 'CANCELED' || upperRaw === 'CANCELED') return 'canceled';
    if (upperRaw.includes('RELEASE') || upperRaw === 'PAYMENT_RELEASED') return 'payment_release';
    return raw;
  };

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiClient.get('/api/orders');
      const data = response.data || response;
      
      // Handle different response structures
      let orderList: any[] = [];
      if (data?.data && Array.isArray(data.data)) {
        orderList = data.data;
      } else if (Array.isArray(data)) {
        orderList = data;
      } else if (data?.orders) {
        orderList = data.orders;
      }
      
      // Normalize order data
      const normalizedOrders: AdminOrder[] = orderList.map((order: any) => {
        const mainStatus = order.Status || order.status;
        const shippingStatus = order.ShippingStatus || order.shipping_status;
        const paymentStatus = order.PaymentStatus || order.payment_status;
        
        // Determine final status
        let finalStatus = 'pending';
        if (mainStatus) {
          const normalizedMain = normalizeStatus(mainStatus);
          if (['processing', 'shipped', 'delivered', 'cancelled', 'payment_release'].includes(normalizedMain)) {
            finalStatus = normalizedMain;
          } else if (shippingStatus) {
            finalStatus = normalizeStatus(shippingStatus);
          } else if (paymentStatus) {
            finalStatus = normalizeStatus(paymentStatus);
          } else {
            finalStatus = normalizedMain;
          }
        } else if (shippingStatus) {
          finalStatus = normalizeStatus(shippingStatus);
        } else if (paymentStatus) {
          finalStatus = normalizeStatus(paymentStatus);
        }
        
        return {
          id: order.OrderID || order.ID || order.id,
          userId: order.UserID || order.user_id || order.userId,
          customerName: order.customerName || order.CustomerName || 'N/A',
          customerEmail: order.customerEmail || order.CustomerEmail || '',
          items: (order.Items || order.items || []).map((item: any) => ({
            productId: item.ProductID || item.product_id || item.productId,
            quantity: item.Quantity || item.quantity || 0,
            price: item.Price || item.price || 0,
            name: item.Name || item.name,
            variant_id: item.variant_id || item.variantId || item.VariantID,
            size: item.size || item.Size,
            color: item.color || item.Color,
          })),
          total: order.TotalPrice || order.total_price || order.totalPrice || 0,
          status: finalStatus,
          shippingAddress: order.ShippingAddress || order.shipping_address || order.shippingAddress,
          createdAt: order.CreatedAt || order.created_at || order.createdAt || new Date(),
          updatedAt: order.UpdatedAt || order.updated_at || order.UpdatedAt || new Date(),
        };
      });
      
      setOrders(normalizedOrders);
    } catch (err: any) {
      console.error('[AdminOrders] Fetch error:', err);
      setError('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    filterAndSortOrders();
  }, [orders, searchTerm, selectedStatus, sortBy, sortOrder]);

  const filterAndSortOrders = () => {
    let filtered = orders.filter(order => {
      const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (order.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (order.customerEmail || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
      
      return matchesSearch && matchesStatus;
    });

    // Sort orders
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'total':
          aValue = a.total;
          bValue = b.total;
          break;
        case 'customerName':
          aValue = (a.customerName || '').toLowerCase();
          bValue = (b.customerName || '').toLowerCase();
          break;
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredOrders(filtered);
  };

  const handleStatusChange = (orderId: string, newStatus: string, oldStatus: string) => {
    // Các status update trực tiếp (không cần modal)
    updateOrderStatus(orderId, newStatus);
  };

  const handleCancelOrder = (orderId: string, currentStatus: string) => {
    // Hiển thị modal xác nhận khi click button hủy
    setConfirmAction({
      orderId,
      newStatus: 'cancelled',
      oldStatus: currentStatus,
    });
    setShowConfirmModal(true);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // Map frontend status to backend format
      const statusMap: Record<string, string> = {
        'pending': 'PENDING',
        'processing': 'PROCESSING',
        'shipped': 'DELIVERING',
        'delivered': 'DELIVERED',
        'cancelled': 'CANCELLED',
      };
      
      const backendStatus = statusMap[newStatus] || newStatus.toUpperCase();
      
      // Nếu là cancelled, gọi cancel API endpoint
      if (newStatus === 'cancelled') {
        await apiClientMain.post(`/api/orders/cancel/${orderId}`, {});
      } else {
        // Các status khác dùng update-status endpoint
        await apiClient.post(`/orders/${orderId}/update-status`, { status: backendStatus });
      }
      
      await fetchOrders(); // Refresh orders list
    } catch (err: any) {
      console.error('Error updating order status:', err);
      setError(err.message || 'Không thể cập nhật trạng thái đơn hàng');
    }
  };

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
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400';
      case 'payment_release':
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
      case 'cancelled':
        return 'Đã hủy';
      case 'payment_release':
        return 'Đã giải ngân';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'processing':
        return <Package className="w-4 h-4" />;
      case 'shipped':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />;
      case 'payment_release':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin"
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Quản lý đơn hàng
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Quản lý tất cả đơn hàng của khách hàng
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Chờ xử lý</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {orders.filter(o => o.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Đang xử lý</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {orders.filter(o => o.status === 'processing').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Truck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Đã gửi</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {orders.filter(o => o.status === 'shipped').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Đã giao</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {orders.filter(o => o.status === 'delivered' || o.status === 'payment_release').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm đơn hàng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ xử lý</option>
                <option value="processing">Đang xử lý</option>
                <option value="shipped">Đã gửi</option>
                <option value="delivered">Đã giao</option>
                <option value="cancelled">Đã hủy</option>
                <option value="payment_release">Đã giải ngân</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="createdAt">Ngày tạo</option>
                <option value="total">Tổng tiền</option>
                <option value="customerName">Tên khách hàng</option>
              </select>

              {/* Sort Order */}
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="desc">Mới nhất</option>
                <option value="asc">Cũ nhất</option>
              </select>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Hiển thị {filteredOrders.length} trong tổng số {orders.length} đơn hàng
              </p>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Mã đơn
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Khách hàng
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Sản phẩm
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Tổng tiền
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Trạng thái
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Ngày tạo
                    </th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-white">
                        #{order.id}
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {order.customerName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {order.customerEmail}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {order.items.length} sản phẩm
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {order.items[0]?.name || 'N/A'}
                          {order.items.length > 1 && ` +${order.items.length - 1} khác`}
                        </div>
                        {order.items[0] && (order.items[0].size || order.items[0].color) && (
                          <div className="flex items-center gap-2 mt-1">
                            {order.items[0].size && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                Size: {order.items[0].size}
                              </span>
                            )}
                            {order.items[0].color && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                                Màu: {order.items[0].color}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-white">
                        {formatPrice(order.total)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1">{getStatusText(order.status)}</span>
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {order.status !== 'cancelled' && order.status !== 'delivered' && (
                            <button
                              onClick={() => handleCancelOrder(order.id, order.status)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors"
                            >
                              Hủy
                            </button>
                          )}
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value, order.status)}
                            className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="pending">Chờ xử lý</option>
                            <option value="processing">Đang xử lý</option>
                            <option value="shipped">Đã gửi</option>
                            <option value="delivered">Đã giao</option>
                            <option value="cancelled">Đã hủy</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
                  Không tìm thấy đơn hàng nào
                </p>
                <p className="text-gray-500 dark:text-gray-500 mt-2">
                  Thử thay đổi bộ lọc hoặc kiểm tra lại từ khóa tìm kiếm
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Hủy đơn hàng
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Bạn chắc chắn muốn hủy đơn hàng này?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    // Reset dropdown về status cũ bằng cách update lại order trong state
                    setOrders(prevOrders => 
                      prevOrders.map(order => 
                        order.id === confirmAction.orderId 
                          ? { ...order, status: confirmAction.oldStatus as any }
                          : order
                      )
                    );
                    setFilteredOrders(prevFiltered => 
                      prevFiltered.map(order => 
                        order.id === confirmAction.orderId 
                          ? { ...order, status: confirmAction.oldStatus as any }
                          : order
                      )
                    );
                    setShowConfirmModal(false);
                    setConfirmAction(null);
                  }}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  Không
                </button>
                <button
                  onClick={async () => {
                    try {
                      await updateOrderStatus(confirmAction.orderId, confirmAction.newStatus);
                      setShowConfirmModal(false);
                      setConfirmAction(null);
                    } catch (error) {
                      console.error('Error cancelling order:', error);
                    }
                  }}
                  className="px-6 py-2 rounded-lg text-white font-medium transition bg-red-600 hover:bg-red-700"
                >
                  Hủy đơn hàng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
