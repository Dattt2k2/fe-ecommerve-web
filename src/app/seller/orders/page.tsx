'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';
import { forceClientLogout, apiClient, API_ENDPOINTS } from '@/lib/api';
import { ChevronRight, Package, Clock, Check, X } from 'lucide-react';

interface Order {
  id?: string;
  ID?: string;
  OrderID?: string;
  userId?: string;
  UserID?: string;
  items: Array<{
    productId?: string;
    ProductID?: string;
    quantity: number;
    Quantity?: number;
    price: number;
    Price?: number;
    name?: string;
    Name?: string;
  }>;
  totalPrice?: number;
  TotalPrice?: number;
  status?: string;
  Status?: string;
  payment_status?: string;
  PaymentStatus?: string;
  createdAt?: string;
  CreatedAt?: string;
  updatedAt?: string;
  UpdatedAt?: string;
  shippingAddress?: string;
  ShippingAddress?: string;
  customerEmail?: string;
  CustomerEmail?: string;
  deliveryDate?: string;
  paymentReleaseDate?: string;
  paymentStatus?: string;
  shippingStatus?: string;
}

export default function SellerOrdersPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Use uppercase constants for filter state to match normalized order.status
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'PROCESSING' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED' | 'PAYMENT_RELEASE'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [totalRevenueState, setTotalRevenueState] = useState<number>(0);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) {
        setError('Không có token xác thực');
        return;
      }

      // Build query params
      const queryParams = new URLSearchParams();
      queryParams.append('page', currentPage.toString());
      queryParams.append('limit', '10');
      
      // Add status filter if not 'all'
      if (filter !== 'all') {
        queryParams.append('status', filter);
      }
      
      // Add month filter if selected
      if (selectedMonth !== null) {
        queryParams.append('month', selectedMonth.toString());
      }
      
      // Add year filter if selected
      if (selectedYear !== null) {
        queryParams.append('year', selectedYear.toString());
      }

      const apiUrl = `/api/seller/orders?${queryParams.toString()}`;
      console.log('[SellerOrders] Fetching from:', apiUrl);
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[SellerOrders] Response status:', response.status);

      if (response.status === 401) {
        forceClientLogout();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData?.message || errorData?.error || `Lỗi ${response.status}`;
        console.error('[SellerOrders] Error:', errMsg);
        setError(errMsg);
        return;
      }

      const data = await response.json();
      console.log('[SellerOrders] Data received:', data);
      
      // Handle different response structures
      let orderList: any[] = [];
      if (data?.data && Array.isArray(data.data)) {
        orderList = data.data;
      } else if (Array.isArray(data)) {
        orderList = data;
      } else if (data?.orders) {
        orderList = data.orders;
      }
      
      console.log('[SellerOrders] Order list:', orderList);
      
      // Normalize order data (convert PascalCase to camelCase)
      const normalizeStatus = (s: any) => {
        if (!s && s !== 0) return 'PENDING';
        const raw = String(s).toLowerCase();
        // Normalize common variants
        if (raw === 'canceled' || raw === 'cancelled') return 'CANCELLED';
        // Map payment release variants to our dedicated PAYMENT_RELEASE stage
        if (raw.includes('release') || raw === 'payment_released' || raw === 'released') return 'PAYMENT_RELEASE';
        // Map shipping statuses
        if (raw === 'pending' || raw === 'payment_held' || raw === 'held') return 'PENDING';
        if (raw === 'processing') return 'PROCESSING';
        // Map different "in transit" variants to our internal DELIVERING state
        if (raw === 'delivering' || raw === 'shipping' || raw === 'in_transit' || raw === 'in-transit') return 'DELIVERING';
        // API 'shipped' flag should be considered 'DELIVERED' in our UI
        if (raw === 'shipped') return 'DELIVERED';
        if (raw === 'delivered' || raw === 'completed') return 'DELIVERED';
        // If uppercase, convert and try again
        const upperRaw = String(s).toUpperCase();
        if (upperRaw === 'PENDING' || upperRaw === 'PAYMENT_HELD') return 'PENDING';
        if (upperRaw === 'PROCESSING') return 'PROCESSING';
        if (upperRaw === 'DELIVERING' || upperRaw === 'SHIPPING' || upperRaw === 'IN_TRANSIT') return 'DELIVERING';
        if (upperRaw === 'SHIPPED') return 'DELIVERED';
        if (upperRaw === 'DELIVERED' || upperRaw === 'COMPLETED') return 'DELIVERED';
        if (upperRaw === 'CANCELED' || upperRaw === 'CANCELLED') return 'CANCELLED';
        return upperRaw;
      };

      const normalizedOrders = orderList.map((order: any) => ({
        id: order.OrderID || order.ID || order.id,
        userId: order.UserID || order.user_id || order.userId,
        items: (order.Items || order.items || []).map((item: any) => ({
          productId: item.ProductID || item.product_id || item.productId,
          quantity: item.Quantity || item.quantity || 0,
          price: item.Price || item.price || 0,
          name: item.Name || item.name,
        })),
        totalPrice: order.TotalPrice || order.total_price || order.totalPrice || 0,
        // Normalize status variants so UI shows correct badge (e.g. CANCELED -> CANCELLED)
        // Priority: Status (main order status) > ShippingStatus (for shipping flow) > PaymentStatus (for payment flow)
        // If Status is PROCESSING/DELIVERING/DELIVERED, use it. Otherwise check ShippingStatus
        status: (() => {
          const mainStatus = order.Status || order.status;
          const shippingStatus = order.ShippingStatus || order.shipping_status;
          const paymentStatus = order.PaymentStatus || order.payment_status;
          
          // If main Status exists, normalize it first
          if (mainStatus) {
            const normalizedMain = normalizeStatus(mainStatus);
            // If it's a valid status (shipping, payment release, or cancelled), use it
            if (['PROCESSING', 'DELIVERING', 'DELIVERED', 'CANCELLED', 'PAYMENT_RELEASE'].includes(normalizedMain)) {
              return normalizedMain;
            }
            // If normalized status is not in our list, check if ShippingStatus or PaymentStatus is more relevant
            // But if mainStatus is PAYMENT_RELEASED, we should return PAYMENT_RELEASE
            if (normalizedMain === 'PAYMENT_RELEASE') {
              return normalizedMain;
            }
            // Fallback to ShippingStatus or PaymentStatus
            if (shippingStatus) {
              return normalizeStatus(shippingStatus);
            }
            if (paymentStatus) {
              return normalizeStatus(paymentStatus);
            }
            return normalizedMain;
          }
          
          // If no mainStatus, check ShippingStatus then PaymentStatus
          if (shippingStatus) {
            return normalizeStatus(shippingStatus);
          }
          if (paymentStatus) {
            return normalizeStatus(paymentStatus);
          }
          return 'PENDING';
        })(),
        createdAt: order.CreatedAt || order.created_at || order.CreatedAt,
        updatedAt: order.UpdatedAt || order.updated_at || order.UpdatedAt,
        shippingAddress: order.ShippingAddress || order.shipping_address || order.shippingAddress,
        customerEmail: order.CustomerEmail || order.customer_email || order.customerEmail,
        deliveryDate: order.delivery_date || order.deliveryDate,
        paymentReleaseDate: order.payment_release_date || order.paymentReleaseDate,
        paymentStatus: order.PaymentStatus || order.payment_status,
        shippingStatus: order.ShippingStatus || order.shipping_status,
      }));
      
      console.log('[SellerOrders] Normalized orders:', normalizedOrders);
      // Extract total revenue if provided by backend (supports both snake_case and camelCase)
      const revenueFromApi = (typeof data === 'object' && data !== null) ? (data.total_revenue ?? data.totalRevenue ?? data.revenue ?? null) : null;
      if (typeof revenueFromApi === 'number') {
        setTotalRevenueState(Number(revenueFromApi));
      } else if (typeof revenueFromApi === 'string' && !isNaN(parseFloat(revenueFromApi))) {
        setTotalRevenueState(parseFloat(revenueFromApi));
      } else {
        // Fallback: compute revenue from orders if API doesn't return a revenue field
        setTotalRevenueState(normalizedOrders.reduce((sum: number, o: any) => sum + (o.totalPrice || 0), 0));
      }
      console.log('[SellerOrders] Setting orders, length:', normalizedOrders.length);
      setOrders(normalizedOrders);
      console.log('[SellerOrders] After setOrders');
    } catch (err) {
      console.error('[SellerOrders] Fetch error:', err);
      setError('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filter, selectedMonth, selectedYear]);

  useEffect(() => {
    console.log('[SellerOrders] useEffect triggered - isAuthenticated:', isAuthenticated, 'user:', user?.id);
    if (!isAuthenticated || !user) {
      console.log('[SellerOrders] Not authenticated, redirecting to login');
      router.push('/auth/login');
      return;
    }
    console.log('[SellerOrders] Authenticated, calling fetchOrders');
    fetchOrders();
  }, [isAuthenticated, fetchOrders]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, any> = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Chờ xác nhận', icon: Clock },
      PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Đang xử lý', icon: Check },
      DELIVERING: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Đang giao', icon: Package },
      DELIVERED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đã giao', icon: Check },
      PAYMENT_RELEASE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đã giải ngân', icon: Check },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Đã hủy', icon: X },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <div className={`${config.bg} ${config.text} px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </div>
    );
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const statusFlow: Record<string, string> = {
      PENDING: 'PROCESSING',
      PROCESSING: 'DELIVERING',
      DELIVERING: 'DELIVERED',
    };
    return statusFlow[currentStatus] || null;
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    await updateOrderStatus(orderId, newStatus);
    setSelectedStatus(null);
    setExpandedOrderId(null);
  };

  const expandedOrder = expandedOrderId ? orders.find(o => o.id === expandedOrderId) : null;

  useEffect(() => {
    console.log('[SellerOrders] expandedOrderId changed:', expandedOrderId);
    if (expandedOrder) {
      console.log('[SellerOrders] expandedOrder:', expandedOrder);
    }
  }, [expandedOrderId]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      console.log(`[SellerOrders] Updating order ${orderId} to status ${newStatus}`);
      
      console.log('[SellerOrders] Calling update-status endpoint for order:', orderId, 'status:', newStatus);
      const updResp = await apiClient.post(`/orders/${orderId}/update-status`, { status: newStatus });
      console.log('[SellerOrders] Update-status API response:', updResp);

      console.log('[SellerOrders] Status updated successfully');
      // Refresh orders list
      fetchOrders();
    } catch (err) {
      console.error('[SellerOrders] Update status error:', err);
      setError('Không thể cập nhật trạng thái đơn hàng');
    }
  };

  // Dedicated cancel handler so UI buttons call cancel endpoint explicitly
  const cancelOrder = async (orderId: string) => {
    try {
      console.log('[SellerOrders] Cancelling order:', orderId);
      const resp = await apiClient.post(API_ENDPOINTS.ORDERS.CANCEL_ORDER(orderId));
      console.log('[SellerOrders] Cancel API response:', resp);
      fetchOrders();
    } catch (err) {
      console.error('[SellerOrders] Cancel order error:', err);
      setError('Không thể hủy đơn hàng');
    }
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter);

  console.log('[SellerOrders] Render - orders:', orders.length, 'filteredOrders:', filteredOrders.length, 'filter:', filter);

  const totalRevenue = totalRevenueState || filteredOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Đang tải đơn hàng...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Đơn Hàng</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Quản lý tất cả đơn hàng của bạn</p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          Làm mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Tổng số đơn</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{filteredOrders.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Chờ xác nhận</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {filteredOrders.filter(o => o.status === 'PENDING').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Đang xử lý</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {filteredOrders.filter(o => o.status === 'PROCESSING').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Đang giao</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {filteredOrders.filter(o => o.status === 'DELIVERING').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Đã giao</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {filteredOrders.filter(o => o.status === 'DELIVERED').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Doanh thu</p>
          <p className="text-2xl font-bold text-primary mt-1">{formatPrice(totalRevenue)}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="space-y-4">
        {/* Status Filter */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'PENDING', 'PROCESSING', 'DELIVERING', 'DELIVERED', 'CANCELLED', 'PAYMENT_RELEASE'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {status === 'all' ? 'Tất cả' : {
                PENDING: 'Chờ xác nhận',
                PROCESSING: 'Đang xử lý',
                DELIVERING: 'Đang giao',
                DELIVERED: 'Đã giao',
                CANCELLED: 'Đã hủy',
                PAYMENT_RELEASE: 'Đã giải ngân',
              }[status]}
            </button>
          ))}
        </div>

        {/* Month/Year Filter */}
        <div className="flex gap-4 flex-wrap bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tháng:</label>
            <select
              value={selectedMonth || ''}
              onChange={(e) => setSelectedMonth(e.target.value ? parseInt(e.target.value) : null)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Tất cả các tháng</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Tháng {i + 1}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Năm:</label>
            <select
              value={selectedYear || ''}
              onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : null)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Tất cả các năm</option>
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year}>
                    Năm {year}
                  </option>
                );
              })}
            </select>
          </div>

          {(selectedMonth !== null || selectedYear !== null) && (
            <button
              onClick={() => {
                setSelectedMonth(null);
                setSelectedYear(null);
              }}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        {filteredOrders.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">Không có đơn hàng nào</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Mã đơn</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Số lượng sản phẩm</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Tổng tiền</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Ngày tạo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{(order.id || 'N/A').slice(0, 8)}...</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0} sản phẩm
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary">
                      {formatPrice(order.totalPrice || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status || 'pending')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            const newId = (order.id || '') === expandedOrderId ? null : (order.id || '');
                            console.log('[SellerOrders] Setting expandedOrderId:', newId);
                            setExpandedOrderId(newId);
                          }}
                          className="text-primary hover:text-orange-600 flex items-center gap-1 font-medium transition-colors"
                        >
                          Chi tiết
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        {(order.status === 'PENDING' || order.status === 'PROCESSING') && (
                          <button
                            onClick={() => updateOrderStatus(order.id || '', 'DELIVERING')}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors"
                          >
                            Đang giao
                          </button>
                        )}
                        {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && order.status !== 'PAYMENT_RELEASE' && (order.payment_status || order.PaymentStatus || '').toUpperCase() !== 'PAYMENT_RELEASE' && (order.payment_status || order.PaymentStatus || '').toUpperCase() !== 'PAYMENT_RELEASED' && (
                          <button
                            onClick={() => cancelOrder(order.id || '')}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors"
                          >
                            Hủy
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Chi tiết đơn hàng */}
      {expandedOrderId && expandedOrder && (
        <div 
          className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4"
          onClick={() => setExpandedOrderId(null)}
          style={{ top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div 
            className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-800">
              {/* Mã đơn hàng */}
              <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Mã đơn hàng</label>
                <p className="text-lg font-mono font-semibold text-white mt-1 break-all">{expandedOrder.id}</p>
              </div>

              {/* Trạng thái với Buttons */}
              <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-3 block">Trạng thái đơn hàng</label>
                <div className="flex items-center gap-3 mb-6">
                  {getStatusBadge(expandedOrder.status || 'PENDING')}
                  <p className="text-base font-semibold text-white">
                    {(() => {
                      const statusMap: Record<string, string> = {
                        PENDING: 'Chờ xác nhận',
                        PROCESSING: 'Đang xử lý',
                        DELIVERING: 'Đang giao',
                        DELIVERED: 'Đã giao',
                        CANCELLED: 'Đã hủy',
                        PAYMENT_RELEASE: 'Đã giải ngân',
                      };
                      return statusMap[expandedOrder.status || 'PENDING'] || 'Không xác định';
                    })()}
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  {expandedOrder.status === 'PROCESSING' && (
                    <button
                      onClick={() => handleStatusChange(expandedOrder.id || '', 'DELIVERING')}
                      className="px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
                    >
                      ✓ Chuyển sang Đang giao
                    </button>
                  )}
                  {expandedOrder.status === 'PENDING' && (
                    <button
                      onClick={() => handleStatusChange(expandedOrder.id || '', 'PROCESSING')}
                      className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
                    >
                      ✓ Xác nhận đơn hàng
                    </button>
                  )}
                  {expandedOrder.status !== 'CANCELLED' && expandedOrder.status !== 'DELIVERED' && expandedOrder.status !== 'PAYMENT_RELEASE' && (expandedOrder.payment_status || expandedOrder.PaymentStatus || '').toUpperCase() !== 'PAYMENT_RELEASE' && (expandedOrder.payment_status || expandedOrder.PaymentStatus || '').toUpperCase() !== 'PAYMENT_RELEASED' && (
                    <button
                      onClick={() => { cancelOrder(expandedOrder.id || ''); setSelectedStatus(null); setExpandedOrderId(null); }}
                      className="px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
                    >
                      ✕ Hủy đơn hàng
                    </button>
                  )}
                  {expandedOrder.status === 'DELIVERING' && (
                    <button
                      onClick={() => handleStatusChange(expandedOrder.id || '', 'DELIVERED')}
                      className="px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
                    >
                      Xác nhận giao hàng
                    </button>
                  )}
                </div>
              </div>

              {/* Thông tin giao hàng */}
              <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-3 block">Địa chỉ giao hàng</label>
                <p className="text-white font-medium leading-relaxed">{expandedOrder.shippingAddress || 'N/A'}</p>
              </div>

              {/* Danh sách sản phẩm */}
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-4 block">Sản phẩm trong đơn hàng</label>
                <div className="space-y-3 bg-slate-700 p-6 rounded-lg border border-slate-600">
                  {expandedOrder.items && expandedOrder.items.length > 0 ? (
                    expandedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center pb-3 border-b border-slate-600 last:border-b-0 last:pb-0">
                        <div className="flex-1">
                          <p className="font-semibold text-white text-sm">{item.name || 'Sản phẩm'}</p>
                          <p className="text-xs text-slate-400 mt-1">Số lượng: <span className="font-semibold">{item.quantity || 0}</span></p>
                        </div>
                        <p className="font-bold text-orange-400 ml-4 text-sm">{formatPrice(item.price || 0)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-center py-4">Không có sản phẩm</p>
                  )}
                </div>
              </div>

              {/* Tổng tiền */}
              <div className="flex justify-between items-center p-6 bg-gradient-to-r from-orange-600 to-orange-500 rounded-lg border border-orange-400">
                <p className="text-sm font-semibold text-white uppercase tracking-wide">Tổng tiền:</p>
                <p className="text-2xl font-bold text-white">{formatPrice(expandedOrder.totalPrice || 0)}</p>
              </div>

              {/* Ngày tạo */}
              <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1 block">Ngày đặt hàng</label>
                <p className="text-white font-medium">
                  {expandedOrder.createdAt ? new Date(expandedOrder.createdAt).toLocaleString('vi-VN') : 'N/A'}
                </p>
              </div>

              {/* Ngày giao hàng */}
              {expandedOrder.deliveryDate && (
                <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1 block">Ngày giao hàng</label>
                  <p className="text-white font-medium">
                    {new Date(expandedOrder.deliveryDate).toLocaleString('vi-VN')}
                  </p>
                </div>
              )}

              {/* Ngày giải ngân */}
              {expandedOrder.paymentReleaseDate && (
                <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1 block">Ngày giải ngân</label>
                  <p className="text-white font-medium">
                    {new Date(expandedOrder.paymentReleaseDate).toLocaleString('vi-VN')}
                  </p>
                </div>
              )}
            </div>

            {/* Footer - Fixed */}
            <div className="flex-shrink-0 px-8 py-4 border-t border-slate-600 flex justify-end gap-3 bg-slate-700">
              <button
                onClick={() => {
                  setExpandedOrderId(null);
                }}
                className="px-6 py-2.5 border border-slate-500 rounded-lg text-white hover:bg-slate-600 transition-all duration-200 font-semibold text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

