"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { apiClient, API_ENDPOINTS } from '@/lib/api';
import Link from 'next/link';

interface OrderItem {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  source: string;
  payment_method: string;
  shipping_address: string;
  status?: string;
  payment_status?: string;
  shipping_status?: string;
  total?: number;
  created_at?: string;
  updated_at?: string;
}

export default function MyOrdersPage() {
  const { showError, showSuccess } = useToast();
  const { loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'cancel' | 'confirm-delivery';
    orderId: string;
    message: string;
  } | null>(null);

  // fetchOrders extracted so other handlers/effects can trigger refresh
  const fetchOrders = useCallback(async (page: number = 1) => {
    try {
      if (authLoading) {
        console.log('[MyOrders] fetchOrders: auth still loading, skipping');
        return;
      }
      setLoading(true);
      console.log('[MyOrders] Fetching user orders from:', `${API_ENDPOINTS.ORDERS.USER_ORDERS}?page=${page}`);
      const ordersData: any = await apiClient.get(`${API_ENDPOINTS.ORDERS.USER_ORDERS}?page=${page}&limit=10`);
      console.log('[MyOrders] Orders data received:', ordersData);

      let orderList: any[] = [];
      let paginationData: any = {};

      if (ordersData?.data && Array.isArray(ordersData.data)) {
        orderList = ordersData.data;
        paginationData = ordersData;
      } else if (Array.isArray(ordersData)) {
        orderList = ordersData;
      } else if (ordersData && typeof ordersData === 'object') {
        orderList = ordersData.orders || ordersData.items || [];
        paginationData = ordersData.pagination || ordersData;
      }

      setCurrentPage(paginationData.page || page);
      setTotalPages(paginationData.pages || 1);
      setTotalOrders(paginationData.total || orderList.length);
      setHasNext(paginationData.has_next || false);
      setHasPrev(paginationData.has_prev || false);

      const normalizedOrders = orderList.map((order: any) => ({
        id: order.OrderID || order.ID || order.id,
        items: (order.Items || order.items || []).map((item: any) => ({
          product_id: item.product_id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        source: order.Source || order.source,
        payment_method: order.PaymentMethod || order.payment_method,
        shipping_address: order.ShippingAddress || order.shipping_address,
        status: order.Status || order.status,
        payment_status: order.PaymentStatus || order.payment_status,
        shipping_status: order.ShippingStatus || order.shipping_status,
        total: order.TotalPrice || order.total,
        created_at: order.CreatedAt || order.created_at,
        updated_at: order.UpdatedAt || order.updated_at,
      }));

      setOrders(normalizedOrders);
      console.log('[MyOrders] Normalized orders set:', normalizedOrders);
    } catch (error) {
      console.log('[MyOrders] Error fetching orders:', error);
      showError('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [authLoading, showError]);

  // Initial fetch + refresh on page focus
  useEffect(() => {
    if (!authLoading) {
      fetchOrders(currentPage);
    }
  }, [authLoading, fetchOrders, currentPage]);

  const getStatusBadgeColor = (status?: string, paymentStatus?: string) => {
    const normalizedStatus = status?.toLowerCase() || '';
    const normalizedPaymentStatus = paymentStatus?.toLowerCase() || '';
    
    // Ưu tiên Status chính của đơn hàng
    switch (normalizedStatus) {
      case 'cancelled':
      case 'canceled':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 'delivering':
      case 'shipping':
        return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200';
      case 'delivered':
      case 'completed':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'processing':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'payment_held':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200';
      case 'payment_release':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'pending':
        // Nếu pending và chưa thanh toán thì màu vàng
        if (normalizedPaymentStatus === 'pending' || normalizedPaymentStatus === 'pending_verification') {
          return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
        }
        return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const getStatusLabel = (status?: string, paymentStatus?: string, shippingStatus?: string) => {
    const normalizedStatus = status?.toLowerCase() || '';
    const normalizedPaymentStatus = paymentStatus?.toLowerCase() || '';

    // Ưu tiên Status chính của đơn hàng
    switch (normalizedStatus) {
      case 'cancelled':
      case 'canceled':
        return 'Đã hủy';
      case 'shipped':
        return 'Đã nhận hàng';
      case 'delivering':
      case 'shipping':
        return 'Đang giao';
      case 'delivered':
      case 'completed':
        return 'Đã giao';
      case 'processing':
        return 'Đang xử lý';
      case 'payment_held':
        return 'Chờ xác nhận';
      case 'payment_release':
        return 'Đã giải ngân';
      case 'pending':
        // Nếu pending và chưa thanh toán thì hiển thị "Chờ thanh toán"
        if (normalizedPaymentStatus === 'pending' || normalizedPaymentStatus === 'pending_verification') {
          return 'Chờ thanh toán';
        }
        return 'Chờ xác nhận';
      default:
        return 'Đang xử lý';
    }
  };

  const getPaymentMethodLabel = (method?: string) => {
    switch (method?.toUpperCase()) {
      case 'COD':
        return 'Thanh toán khi nhận hàng';
      case 'DIRECT_PAYMENT':
        return 'Trả trực tiếp';
      default:
        return method || 'Chưa xác định';
    }
  };

  const getPaymentStatusLabel = (paymentStatus?: string) => {
    if (!paymentStatus) return 'N/A';
    
    const normalized = paymentStatus.toUpperCase();
    
    // Kiểm tra các trạng thái đã thanh toán
    if (isPaymentCompleted(paymentStatus)) {
      return 'Đã thanh toán';
    }
    
    // Các trạng thái chờ thanh toán
    switch (normalized) {
      case 'COD_PENDING':
        return 'Chờ thanh toán (COD)';
      case 'PENDING':
      case 'PENDING_VERIFICATION':
        return 'Chờ thanh toán';
      case 'PAYMENT_HELD':
      case 'PAYMENT-HELD':
      case 'HELD':
        return 'Đã giữ tiền';
      case 'PAYMENT_RELEASE':
      case 'PAYMENT_RELEASED':
      case 'PAYMENT-RELEASE':
        return 'Đã giải ngân';
      case 'FAILED':
      case 'CANCELLED':
      case 'CANCELED':
        return 'Thanh toán thất bại';
      case 'AUTHORIZED':
        return 'Đã ủy quyền';
      default:
        return paymentStatus
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
    }
  };

  const isPaymentCompleted = (paymentStatus?: string) => {
    const s = (paymentStatus || '').toLowerCase();
    // Treat common forms of completed/held/approved payments as "paid" for the UI
    return [
      'checkout_completed',
      'completed',
      'paid',
      'payment_held',
      'payment_release',
      'paymentheld',
      'payment-held',
      'held',
      'authorized',
    ].includes(s);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
              <svg className="w-10 h-10 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Đơn Hàng Của Tôi
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Theo dõi và quản lý đơn hàng của bạn</p>
          </div>
          <Link 
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Tiếp tục mua sắm
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 font-medium">Đang tải đơn hàng...</p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">Vui lòng chờ trong giây lát</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-gray-100 dark:from-slate-800/50 dark:to-gray-800/50 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Chưa có đơn hàng nào</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8">Hãy khám phá và đặt hàng ngay để trải nghiệm dịch vụ của chúng tôi!</p>
              <Link 
                href="/"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Khám phá sản phẩm
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300"
              >
                {/* Order Header - Summary (Always Visible) */}
                <div 
                  onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                  className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-5 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      {/* Mã đơn hàng */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Mã đơn hàng</p>
                          <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white truncate" title={order.id}>
                            {order.id.substring(0, 18)}...
                          </p>
                        </div>
                      </div>

                      {/* Trạng thái đơn hàng */}
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Trạng thái đơn hàng</p>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusBadgeColor(order.status, order.payment_status)}`}>
                          <span className="w-2 h-2 rounded-full bg-current"></span>
                          {getStatusLabel(order.status, order.payment_status, order.shipping_status)}
                        </span>
                      </div>

                      {/* Thanh toán */}
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Thanh toán</p>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                          isPaymentCompleted(order.payment_status) 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        }`}>
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            {isPaymentCompleted(order.payment_status) ? (
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            ) : (
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            )}
                          </svg>
                          {isPaymentCompleted(order.payment_status) ? 'Đã thanh toán' : 'Chờ thanh toán'}
                        </span>
                      </div>

                      {/* Ngày đặt */}
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Ngày đặt</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {order.created_at ? new Date(order.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                        </p>
                      </div>

                      {/* Tổng cộng */}
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Tổng cộng</p>
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          {order.total ? order.total.toLocaleString() : '0'}
                          <span className="text-sm font-normal">VND</span>
                        </p>
                      </div>
                    </div>

                    {/* Expand Button */}
                    <button className="ml-4 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors">
                      <svg 
                        className={`w-6 h-6 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${expandedOrderId === order.id ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Order Details - Expanded Content */}
                {expandedOrderId === order.id && (
                  <>
                    {/* Order Items */}
                    <div className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Sản phẩm:</p>
                      <div className="space-y-3">
                        {order.items && order.items.map((item) => (
                          <div key={item.product_id} className="flex items-center justify-between text-sm">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                              <p className="text-gray-600 dark:text-gray-400">Số lượng: {item.quantity}</p>
                            </div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {(item.price * item.quantity).toLocaleString()} VND
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-700">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Địa chỉ giao hàng</p>
                          <p className="text-gray-900 dark:text-white">{order.shipping_address}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Phương thức thanh toán</p>
                          <p className="text-gray-900 dark:text-white">{getPaymentMethodLabel(order.payment_method)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Trạng thái thanh toán</p>
                          <p className="text-gray-900 dark:text-white">
                            {getPaymentStatusLabel(order.payment_status)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Trạng thái giao hàng</p>
                          <p className="text-gray-900 dark:text-white">
                            {order.status === 'SHIPPED' ? 'Đã nhận hàng' : 
                             order.shipping_status === 'pending' ? 'Chờ giao hàng' : 
                             order.shipping_status === 'delivered' ? 'Đã giao hàng' : 
                             order.shipping_status || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Order Footer - Action Buttons */}
                    <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex flex-wrap gap-2">
                      {/* Hủy đơn hàng - nếu chưa được giao */}
                      {(
                        (order.status?.toUpperCase() === 'PENDING' || 
                        order.status?.toUpperCase() === 'PAYMENT_HELD' || 
                        order.status?.toUpperCase() === 'PROCESSING') &&
                        order.payment_status?.toUpperCase() !== 'PAYMENT_RELEASE' &&
                        order.payment_status?.toUpperCase() !== 'PAYMENT_RELEASED'
                      ) && (
                        <button
                          onClick={() => {
                            setConfirmAction({
                              type: 'cancel',
                              orderId: order.id,
                              message: 'Bạn chắc chắn muốn hủy đơn hàng này?'
                            });
                            setShowConfirmModal(true);
                          }}
                          className="bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800 text-white font-medium py-2 px-6 rounded-lg transition text-center"
                        >
                          Hủy đơn hàng
                        </button>
                      )}
                      
                      {/* Đã nhận hàng - nếu đã giao (DELIVERED) */}
                      {order.status?.toUpperCase() === 'DELIVERED' && (
                        <button
                          onClick={() => {
                            setConfirmAction({
                              type: 'confirm-delivery',
                              orderId: order.id,
                              message: 'Xác nhận bạn đã nhận hàng?'
                            });
                            setShowConfirmModal(true);
                          }}
                          className="bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800 text-white font-medium py-2 px-6 rounded-lg transition text-center"
                        >
                          Đã nhận hàng
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && orders.length > 0 && totalPages > 1 && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Hiển thị {orders.length} trong tổng số {totalOrders} đơn hàng
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={!hasPrev}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  hasPrev
                    ? 'bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                ← Trước
              </button>
              
              <div className="flex items-center gap-2">
                {/* Show page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg font-medium transition ${
                        currentPage === pageNum
                          ? 'bg-blue-600 dark:bg-blue-700 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={!hasNext}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  hasNext
                    ? 'bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div 
          className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4"
          onClick={() => setShowConfirmModal(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {confirmAction.type === 'cancel' ? 'Hủy đơn hàng' : 'Xác nhận nhận hàng'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {confirmAction.message}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  Không
                </button>
                <button
                  onClick={async () => {
                    try {
                      if (confirmAction.type === 'cancel') {
                        await apiClient.post(API_ENDPOINTS.ORDERS.CANCEL_ORDER(confirmAction.orderId), {});
                        showSuccess('Đơn hàng đã được hủy');
                      } else {
                        await apiClient.post(`/orders/${confirmAction.orderId}/update-status`, {
                          status: 'SHIPPED'
                        });
                        showSuccess('Đã xác nhận nhận hàng');
                      }
                      setShowConfirmModal(false);
                      fetchOrders(currentPage);
                    } catch (error) {
                      console.error('Error:', error);
                      showError(confirmAction.type === 'cancel' ? 'Không thể hủy đơn hàng' : 'Không thể xác nhận nhận hàng');
                    }
                  }}
                  className={`px-6 py-2 rounded-lg text-white font-medium transition ${
                    confirmAction.type === 'cancel'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {confirmAction.type === 'cancel' ? 'Hủy đơn hàng' : 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
