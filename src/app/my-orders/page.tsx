"use client";

import { useEffect, useState, useRef } from 'react';
import { useToast } from '@/context/ToastContext';
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
  total?: number;
  created_at?: string;
  updated_at?: string;
}

export default function MyOrdersPage() {
  const { showError, showSuccess } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) {
      console.log('[MyOrders] Already initialized, skipping effect');
      return;
    }
    console.log('[MyOrders] Starting effect...');
    hasInitialized.current = true;

    let isMounted = true;

    const fetchOrders = async () => {
      try {
        console.log('[MyOrders] Fetching user orders');
        const ordersData = await apiClient.get(API_ENDPOINTS.ORDERS.USER_ORDERS);
        console.log('Orders data received:', ordersData);

        if (isMounted) {
          let orderList: any[] = [];
          
          // Handle different response structures
          if (ordersData?.data && Array.isArray(ordersData.data)) {
            orderList = ordersData.data;
          } else if (Array.isArray(ordersData)) {
            orderList = ordersData;
          } else if (ordersData && typeof ordersData === 'object') {
            orderList = (ordersData as any).orders || (ordersData as any).items || [];
          }

          // Normalize order data (convert PascalCase to camelCase)
          const normalizedOrders = orderList.map((order: any) => ({
            id: order.ID || order.id,
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
            total: order.TotalPrice || order.total,
            created_at: order.CreatedAt || order.created_at,
            updated_at: order.UpdatedAt || order.updated_at,
          }));

          setOrders(normalizedOrders);
          console.log('Normalized orders:', normalizedOrders);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching orders:', error);
          showError('Không thể tải danh sách đơn hàng');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      console.log('[MyOrders] Cleanup');
      isMounted = false;
    };
  }, [showError]);

  const getStatusBadgeColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'processing':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'completed':
      case 'delivered':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'Chờ xác nhận';
      case 'PROCESSING':
        return 'Chờ xác nhận';
      case 'SHIPPED':
        return 'Đã giao';
      case 'DELIVERED':
        return 'Đã nhận';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status || 'Đang xử lý';
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Đơn Hàng Của Tôi</h1>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Đang tải đơn hàng...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">Bạn chưa có đơn hàng nào</p>
            <Link 
              href="/products"
              className="inline-block bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white font-medium py-2 px-6 rounded-lg transition"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Order Header - Summary (Always Visible) */}
                <div 
                  onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                  className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Mã đơn hàng</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{order.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Trạng thái</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Ngày đặt</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Tổng cộng</p>
                      <p className="font-bold text-blue-600 dark:text-blue-400">
                        {order.total ? order.total.toLocaleString() : '0'} VND
                      </p>
                    </div>
                    <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                      {expandedOrderId === order.id ? '▼' : '▶'}
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
                      </div>
                    </div>

                    {/* Order Footer - Action Buttons */}
                    <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex flex-wrap gap-2">
                      {/* Hủy đơn hàng - nếu chưa được xác nhận */}
                      {(order.status?.toUpperCase() === 'PENDING' || order.status?.toUpperCase() === 'PROCESSING') && (
                        <button
                          onClick={async () => {
                            if (confirm('Bạn chắc chắn muốn hủy đơn hàng này?')) {
                              try {
                                await apiClient.post(API_ENDPOINTS.ORDERS.CANCEL_ORDER(order.id), {});
                                showSuccess('Đơn hàng đã được hủy');
                                // Refresh orders list
                                window.location.reload();
                              } catch (error) {
                                console.error('Error cancelling order:', error);
                                showError('Không thể hủy đơn hàng');
                              }
                            }
                          }}
                          className="bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800 text-white font-medium py-2 px-6 rounded-lg transition text-center"
                        >
                          Hủy đơn hàng
                        </button>
                      )}
                      
                      {/* Xác nhận đơn hàng - nếu đã ship */}
                      {order.status?.toUpperCase() === 'SHIPPED' && (
                        <button
                          onClick={async () => {
                            try {
                              // Gọi API để xác nhận order
                              await apiClient.post(`/api/orders/${order.id}/confirm`, {});
                              showSuccess('Đơn hàng đã được xác nhận');
                              // Refresh orders list
                              window.location.reload();
                            } catch (error) {
                              console.error('Error confirming order:', error);
                              showError('Không thể xác nhận đơn hàng');
                            }
                          }}
                          className="bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800 text-white font-medium py-2 px-6 rounded-lg transition text-center"
                        >
                          Xác nhận đơn hàng
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
