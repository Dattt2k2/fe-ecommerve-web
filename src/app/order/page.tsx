"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { apiClient, API_ENDPOINTS } from '@/lib/api';

export default function OrderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const { user: authUser, loading: authLoading } = useAuth();
  const hasInitialized = useRef(false);

  const productId = searchParams.get('productId');
  const quantity = searchParams.get('quantity') || 1;

  const [product, setProduct] = useState<{ name: string; price: number; category?: string; image?: string } | null>(null);
  const [userInfo, setUserInfo] = useState<{ name: string; phone: string } | null>(null);
  const [addresses, setAddresses] = useState<Array<{ id: string; address: string }>>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [customAddress, setCustomAddress] = useState<string>('');
  const [showAddressForm, setShowAddressForm] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [shippingMethod, setShippingMethod] = useState('Nhanh');
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
  // Đợi cho auth context sẵn sàng
  if (authLoading) {
    console.log('[OrderPage] Auth đang loading, chưa fetch');
    return;
  }

  if (!authUser) {
    console.log('[OrderPage] Chưa có authUser, bỏ qua fetch');
    return;
  }

  console.log('[OrderPage] Bắt đầu fetch dữ liệu');

  let isMounted = true;

  const fetchProduct = async () => {
    try {
      console.log('[OrderPage] Fetching product:', productId);
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) throw new Error('Failed to fetch product');
      const data = await response.json();
      if (isMounted) setProduct(data);
    } catch (error) {
      if (isMounted) {
        console.error('Error fetching product:', error);
        showError('Không thể tải thông tin sản phẩm');
      }
    }
  };

  const fetchUserInfo = async () => {
    try {
      console.log('[OrderPage] Fetching user info');
      const userResponse = await apiClient.get(API_ENDPOINTS.USERS.DETAIL());
      if (isMounted && userResponse) {
        const firstName = (userResponse as any)?.first_name || '';
        const lastName = (userResponse as any)?.last_name || '';
        const phone = (userResponse as any)?.phone || '';
        const combinedName = `${firstName} ${lastName}`.trim();

        const userInfoData = {
          name: combinedName || (userResponse as any)?.name || (userResponse as any)?.email || 'Người dùng',
          phone: phone || '',
        };
        setUserInfo(userInfoData);
      }
    } catch (error) {
      if (isMounted) {
        console.error('Error fetching user info:', error);
        if (authUser) {
          const fallbackInfo = {
            name: authUser.name || (authUser as any)?.email || 'Người dùng',
            phone: (authUser as any)?.phone || '',
          };
          setUserInfo(fallbackInfo);
        }
      }
    }
  };

  const fetchUserAddress = async () => {
    try {
      console.log('[OrderPage] Fetching user address from:', API_ENDPOINTS.ADDRESS.LIST);
      const addressData = await apiClient.get(API_ENDPOINTS.ADDRESS.LIST);
      let addressList: any[] = [];

      if (Array.isArray(addressData)) {
        addressList = addressData;
      } else if (addressData && typeof addressData === 'object') {
        addressList = (addressData as any).addresses || (addressData as any).data || (addressData as any).items || [];
      }

      if (isMounted) {
        if (addressList && addressList.length > 0) {
          const formattedAddresses = addressList.map((addr: any) => ({
            id: addr.id || addr._id || Math.random().toString(),
            address: addr.street || addr.address || addr.full_address || 'Địa chỉ không xác định',
          }));
          setAddresses(formattedAddresses);
          setSelectedAddressId(formattedAddresses[0].id);
        } else {
          setAddresses([]);
        }
      }
    } catch (error) {
      if (isMounted) {
        console.error('[OrderPage] Error fetching user address:', error);
        setAddresses([]);
      }
    }
  };

  const executeAllFetches = async () => {
    const tasks: Promise<void>[] = [];

    if (productId) tasks.push(fetchProduct());
    tasks.push(fetchUserInfo());
    tasks.push(fetchUserAddress());

    try {
      await Promise.all(tasks);
      console.log('[OrderPage] All fetches completed');
    } catch (err) {
      console.error('[OrderPage] Error in one of fetches:', err);
    }
  };

  executeAllFetches();

  return () => {
    isMounted = false;
    console.log('[OrderPage] Cleanup - unmounted');
  };
}, [authUser, authLoading, productId]);


  const handleOrder = async () => {
    let shippingAddress = '';
    
    if (addresses.length > 0) {
      const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
      shippingAddress = selectedAddress?.address || '';
    } else {
      shippingAddress = customAddress;
    }

    if (!shippingAddress || !paymentMethod) {
      showError('Vui lòng chọn/nhập địa chỉ và phương thức thanh toán');
      return;
    }

    if (!product) {
      showError('Không có thông tin sản phẩm');
      return;
    }

    try {
      setLoading(true);
      
      // Map payment method to backend values
      const paymentMethodMap: { [key: string]: string } = {
        'cash_on_delivery': 'COD',
        'credit_card': 'DIRECT_PAYMENT',
        'stripe': 'STRIPE',
      };

      const response = await apiClient.post(API_ENDPOINTS.ORDERS.ORDER_DIRECT, {
        items: [
          {
            product_id: productId,
            name: product.name,
            quantity: Number(quantity),
            price: product.price,
          }
        ],
        source: 'direct_purchase',
        payment_method: paymentMethodMap[paymentMethod] || paymentMethod,
        shipping_address: shippingAddress,
      });

      const typedResponse = response as any;
      const orderId = typedResponse.order_id || 'unknown';
      console.log('[handleOrder] Order response full:', typedResponse);
      console.log('[handleOrder] Order response keys:', Object.keys(typedResponse));
      console.log('[handleOrder] Extracted orderId:', orderId);
      
      // If payment method is Stripe, create checkout session
      if (paymentMethod === 'stripe') {
        try {
          showSuccess('Đơn hàng đã được tạo! Chuyển hướng đến trang thanh toán...');
          
          const amountToCharge = totalPrice + shippingFee;
          console.log('[handleOrder] Stripe payment - amount:', {
            totalPrice,
            shippingFee,
            amountToCharge,
            productPrice: product?.price,
            quantity: Number(quantity),
          });
          
          // Create Stripe checkout session
          const sessionResponse = await fetch('/api/payment/create-checkout-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId,
              amount: amountToCharge,
              email: authUser?.email || '',
              items: [
                {
                  product_id: productId,
                  name: product?.name || 'Product',
                  price: product?.price || 0,
                  quantity: Number(quantity),
                }
              ],
            }),
          });

          if (!sessionResponse.ok) {
            const error = await sessionResponse.json();
            throw new Error(error.error || 'Failed to create checkout session');
          }

          const sessionData = await sessionResponse.json();
          console.log('Checkout session created:', sessionData);

          // Redirect to Stripe Checkout
          if (sessionData.url) {
            window.location.href = sessionData.url;
          } else {
            showError('Không thể tạo session thanh toán');
          }
        } catch (stripeError) {
          console.error('Error creating checkout session:', stripeError);
          showError((stripeError as any)?.message || 'Có lỗi khi chuyển đến trang thanh toán');
        }
      } else {
        // For COD, redirect to my-orders page
        showSuccess('Đơn hàng đã được tạo thành công!');
        router.push('/my-orders');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      showError((error as any)?.message || 'Có lỗi xảy ra khi tạo đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const parsedQuantity = Number(quantity);
  const shippingFee = 16500;
  const totalPrice = product ? product.price * parsedQuantity : 0;
  const totalPayment = totalPrice + shippingFee;

  console.log('[OrderPage] Rendering with state:', { 
    authLoading, 
    dataLoaded, 
    addressCount: addresses.length, 
    addresses, 
    selectedAddressId, 
    userInfo,
    hasInitialized: hasInitialized.current 
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Thanh Toán</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Order Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Thông tin người nhận */}
            {(userInfo || authUser) ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Địa Chỉ Nhận Hàng</h2>
                
                {/* Chọn từ danh sách địa chỉ nếu có */}
                {addresses.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Chọn địa chỉ giao hàng</label>
                    <select
                      value={selectedAddressId}
                      onChange={(e) => setSelectedAddressId(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {addresses.map((addr) => (
                        <option key={addr.id} value={addr.id}>
                          {addr.address}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Button để thêm địa chỉ mới nếu không có */}
                {addresses.length === 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Bạn chưa có địa chỉ giao hàng nào</p>
                    <button
                      onClick={() => setShowAddressForm(!showAddressForm)}
                      className="w-full bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition"
                    >
                      + Thêm Địa Chỉ Giao Hàng
                    </button>
                  </div>
                )}

                {/* Form thêm địa chỉ */}
                {showAddressForm && addresses.length === 0 && (
                  <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Nhập địa chỉ giao hàng</label>
                    <textarea
                      value={customAddress}
                      onChange={(e) => setCustomAddress(e.target.value)}
                      placeholder="Nhập địa chỉ chi tiết cho việc giao hàng"
                      rows={3}
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowAddressForm(false)}
                        className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white font-medium py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={async () => {
                          if (customAddress.trim()) {
                            try {
                              // Gửi địa chỉ mới lên API
                              const response = await apiClient.post(API_ENDPOINTS.ADDRESS.CREATE, {
                                street: customAddress,
                                city: '',
                                state: '',
                                zip: '',
                                country: '',
                                is_default: true,
                              });
                              console.log('Address saved:', response);
                              
                              const newAddress = {
                                id: (response as any)?.id || (response as any)?._id || Math.random().toString(),
                                address: customAddress,
                              };
                              setAddresses([newAddress]);
                              setSelectedAddressId(newAddress.id);
                              setShowAddressForm(false);
                              setCustomAddress('');
                              showSuccess('Địa chỉ đã được lưu thành công');
                            } catch (error) {
                              console.error('Error saving address:', error);
                              showError('Không thể lưu địa chỉ');
                            }
                          }
                        }}
                        className="flex-1 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition"
                      >
                        Lưu Địa Chỉ
                      </button>
                    </div>
                  </div>
                )}

                {/* Thông tin người nhận */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Người nhận: {userInfo?.name || ''}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Số điện thoại: {userInfo?.phone || ''}</p>
                </div>
              </div>
            ) : null}

            {/* Sản phẩm */}
            {product && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sản phẩm</h2>
                <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  {/* Product Image */}
                  <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0 overflow-hidden">
                    {product.image && (
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Phân loại: {product.category || 'N/A'}</p>
                  </div>
                  {/* Price and Quantity */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-gray-900 dark:text-white">{product.price.toLocaleString()} VND</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">x{parsedQuantity}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Phương thức vận chuyển */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Phương thức vận chuyển</h2>
              <select
                value={shippingMethod}
                onChange={(e) => setShippingMethod(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Nhanh">Nhanh (16,500 VND)</option>
                <option value="Tiết kiệm">Tiết kiệm (8,000 VND)</option>
              </select>
            </div>

            {/* Phương thức thanh toán */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Phương thức thanh toán</h2>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn phương thức thanh toán</option>
                <option value="stripe">Thẻ tín dụng (Stripe)</option>
                <option value="cash_on_delivery">Thanh toán khi nhận hàng</option>
              </select>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tổng kết đơn hàng</h2>
              
              <div className="space-y-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tổng tiền hàng:</span>
                  <span className="text-gray-900 dark:text-white font-medium">{totalPrice.toLocaleString()} VND</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Phí vận chuyển:</span>
                  <span className="text-gray-900 dark:text-white font-medium">{shippingFee.toLocaleString()} VND</span>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4 mb-6">
                <span className="font-semibold text-gray-900 dark:text-white">Tổng thanh toán:</span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalPayment.toLocaleString()} VND</span>
              </div>

              <button
                onClick={handleOrder}
                disabled={loading || !paymentMethod}
                className={`w-full py-3 rounded-lg font-semibold text-white transition ${
                  loading || !paymentMethod
                    ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800'
                }`}
              >
                {loading ? 'Đang xử lý...' : 'Đặt hàng'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}