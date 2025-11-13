'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Package, Truck, Mail } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const orderNumber = `VN${Date.now().toString().slice(-6)}`;

  useEffect(() => {
    // Redirect to my-orders after 3 seconds
    const timer = setTimeout(() => {
      console.log('[CheckoutSuccess] Redirecting to /my-orders');
      router.push('/my-orders');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Đặt hàng thành công!
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Cảm ơn bạn đã mua sắm tại ShopVN. Đơn hàng của bạn đã được xác nhận và đang được xử lý.
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Package className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-900 dark:text-white">
              Mã đơn hàng: #{orderNumber}
            </span>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                Email xác nhận đã được gửi đến hộp thư của bạn
              </span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <Truck className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                Thời gian giao hàng dự kiến: 2-3 ngày làm việc
              </span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-8">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-2">
            Bước tiếp theo:
          </h2>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Chúng tôi sẽ xử lý và đóng gói đơn hàng của bạn</li>
            <li>• Bạn sẽ nhận được thông báo khi đơn hàng được giao cho đơn vị vận chuyển</li>
            <li>• Theo dõi tình trạng đơn hàng trong tài khoản của bạn</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/my-orders"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Xem đơn hàng của tôi
          </Link>
          
          <Link
            href="/products"
            className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
          >
            Tiếp tục mua sắm
          </Link>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-blue-600 dark:text-blue-400 animate-pulse">
            Đang tự động chuyển đến trang đơn hàng trong 3 giây...
          </p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Cần hỗ trợ? Liên hệ{' '}
            <Link href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">
              bộ phận chăm sóc khách hàng
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
