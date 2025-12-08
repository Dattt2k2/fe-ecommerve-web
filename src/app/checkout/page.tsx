'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { CreditCard, Truck, MapPin, Phone, Mail } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';

export default function CheckoutPage() {
  const { items: cartItems, total: cartTotal, itemCount, clearCart } = useCart();
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentWindowRef, setPaymentWindowRef] = useState<Window | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    note: '',
    paymentMethod: 'cod', // cod, credit, momo
  });

  // Get selected items from sessionStorage or use all cart items
  const [items, setItems] = useState(cartItems);
  const [total, setTotal] = useState(cartTotal);

  useEffect(() => {
    // Check if there are selected items in sessionStorage
    const storedItems = sessionStorage.getItem('checkoutItems');
    if (storedItems) {
      try {
        const selectedItems = JSON.parse(storedItems);
        // Convert to CartItem format
        const formattedItems = selectedItems.map((item: any) => ({
          id: item.id,
          product: {
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image || '/placeholder-product.jpg',
            description: '',
            stock: 100,
            category: '',
            rating: 0,
            reviews: 0,
          },
          quantity: item.quantity,
          size: item.size,
          color: item.color,
        }));
        setItems(formattedItems);
        const calculatedTotal = formattedItems.reduce(
          (sum: number, item: any) => sum + item.product.price * item.quantity,
          0
        );
        setTotal(calculatedTotal);
        // Clear sessionStorage after reading
        sessionStorage.removeItem('checkoutItems');
      } catch (error) {
        console.error('Error parsing checkout items:', error);
        // Fallback to cart items
        setItems(cartItems);
        setTotal(cartTotal);
      }
    } else {
      // Use all cart items if no selection
      setItems(cartItems);
      setTotal(cartTotal);
    }
  }, [cartItems, cartTotal]);

  // Lắng nghe message từ window con (payment window)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Chỉ accept message từ origin của chúng ta
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'payment-success') {
        console.log('Payment successful:', event.data.paymentId);
        showSuccess('Thanh toán thành công!');
        clearCart();
        // Chuyển hướng đến trang danh sách đơn hàng
        router.push('/my-orders');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [router, clearCart, showSuccess]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const authToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1];

      const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      
      // Gọi backend để tạo order
      const orderResponse = await fetch(`${BACKEND_URL}/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price,
            size: item.size,
            color: item.color,
          })),
          customerEmail: formData.email,
          customerName: formData.fullName,
          customerPhone: formData.phone,
          shippingAddress: formData.address,
          shippingCity: formData.city,
          shippingDistrict: formData.district,
          shippingWard: formData.ward,
          note: formData.note,
          paymentMethod: formData.paymentMethod,
          totalAmount: total,
          shipping_info: JSON.stringify({
            user_name: formData.fullName || '',
            phone: formData.phone || '',
          }),
        }),
        mode: 'cors',
      });

      console.log('[Checkout] Order response status:', orderResponse.status);

      // Extract orderId từ JSON response
      let orderId = 'unknown';
      try {
        const responseData = await orderResponse.json();
        console.log('[Checkout] Response data:', responseData);
        
        // Lấy order_id từ response (backend trả về order_id)
        orderId = responseData?.order_id || 'unknown';
        console.log('[Checkout] Extracted order ID:', orderId);
        console.log('[Checkout] Full response keys:', Object.keys(responseData || {}));
        
        // Lưu order_id vào localStorage cho payment page
        if (orderId !== 'unknown') {
          localStorage.setItem('current_order_id', orderId);
          console.log('[Checkout] Saved order_id to localStorage:', orderId);
        }
      } catch (e) {
        console.warn('[Checkout] Could not parse JSON response');
        // Thử extract từ URL nếu có redirect
        try {
          const responseUrl = new URL(orderResponse.url);
          orderId = responseUrl.searchParams.get('order_id') || 'unknown';
          console.log('[Checkout] Extracted order ID from URL:', orderId);
          if (orderId !== 'unknown') {
            localStorage.setItem('current_order_id', orderId);
          }
        } catch (urlErr) {
          console.warn('[Checkout] Could not extract order ID');
        }
      }

      // Nếu là thanh toán COD, xong rồi
      if (formData.paymentMethod === 'cod' || formData.paymentMethod === 'COD') {
        showSuccess('Đơn hàng đã được tạo thành công!');
        clearCart();
        setTimeout(() => {
          router.push('/my-orders');
        }, 1500);
        return;
      }

      // Nếu là thanh toán online (credit or momo), mở tab payment mới với orderId
      const paymentUrl = `/payment?order_id=${encodeURIComponent(orderId)}&amount=${total}&email=${encodeURIComponent(formData.email)}`;
      console.log('[Checkout] Opening payment tab:', paymentUrl);
      
      const paymentWindow = window.open(paymentUrl, 'payment_window');
      
      if (paymentWindow) {
        console.log('[Checkout] Payment window opened successfully');
        setPaymentWindowRef(paymentWindow);
      } else {
        console.error('[Checkout] Payment window blocked');
        showError('Trình duyệt đã chặn cửa sổ thanh toán. Vui lòng kiểm tra cài đặt popup.');
      }
      
      setIsProcessing(false);
    } catch (error: any) {
      console.error('[Checkout] Error:', error);
      showError(error.message || 'Có lỗi xảy ra khi đặt hàng');
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-16">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Không có sản phẩm để thanh toán
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán.
          </p>
          <Link
            href="/products"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Thanh toán đơn hàng
      </h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Shipping Information */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Thông tin giao hàng
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tỉnh/Thành phố *
                  </label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Chọn tỉnh/thành</option>
                    <option value="hanoi">Hà Nội</option>
                    <option value="hcm">TP. Hồ Chí Minh</option>
                    <option value="danang">Đà Nẵng</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quận/Huyện *
                  </label>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Chọn quận/huyện</option>
                    <option value="ba-dinh">Ba Đình</option>
                    <option value="cau-giay">Cầu Giấy</option>
                    <option value="dong-da">Đống Đa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phường/Xã *
                  </label>
                  <select
                    name="ward"
                    value={formData.ward}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Chọn phường/xã</option>
                    <option value="phuong-1">Phường 1</option>
                    <option value="phuong-2">Phường 2</option>
                    <option value="phuong-3">Phường 3</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Địa chỉ cụ thể *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Số nhà, tên đường..."
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ghi chú
                </label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Ghi chú cho đơn hàng (tùy chọn)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Phương thức thanh toán
            </h2>

            <div className="space-y-3">
              <label className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={formData.paymentMethod === 'cod'}
                  onChange={handleInputChange}
                  className="mr-3"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Thanh toán khi nhận hàng (COD)</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Thanh toán bằng tiền mặt khi nhận hàng</p>
                </div>
              </label>

              <label className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="credit"
                  checked={formData.paymentMethod === 'credit'}
                  onChange={handleInputChange}
                  className="mr-3"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Thẻ tín dụng/ghi nợ</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Visa, Mastercard, JCB</p>
                </div>
              </label>

              <label className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="momo"
                  checked={formData.paymentMethod === 'momo'}
                  onChange={handleInputChange}
                  className="mr-3"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Ví MoMo</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Thanh toán qua ví điện tử MoMo</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Đơn hàng của bạn
            </h2>

            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
                      {item.product.name}
                    </h4>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Số lượng: {item.quantity}
                      {item.size && ` • Size: ${item.size}`}
                      {item.color && ` • Màu: ${item.color}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Tạm tính:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatPrice(total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Phí vận chuyển:</span>
                <span className="font-medium text-green-600 dark:text-green-400">Miễn phí</span>
              </div>
              <hr className="border-gray-200 dark:border-gray-700" />
              <div className="flex justify-between text-lg font-bold">
                <span className="text-gray-900 dark:text-white">Tổng cộng:</span>
                <span className="text-blue-600 dark:text-blue-400">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                isProcessing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              {isProcessing ? 'Đang xử lý...' : 'Đặt hàng'}
            </button>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
              Bằng việc đặt hàng, bạn đồng ý với{' '}
              <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
                Điều khoản dịch vụ
              </Link>{' '}
              của chúng tôi.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
