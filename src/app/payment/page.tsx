'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const { user: authUser } = useAuth();
  
  const orderId = searchParams.get('order_id');
  const [loading, setLoading] = useState(true);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  useEffect(() => {
    const createCheckoutSession = async () => {
      if (!orderId) {
        showError('Không có thông tin đơn hàng');
        router.push('/');
        return;
      }

      try {
        console.log('[PaymentPage] Creating checkout session for order:', orderId);

        // Fetch order details
        const orderResponse = await fetch(`/api/orders/${orderId}`);
        if (!orderResponse.ok) {
          throw new Error('Không thể lấy thông tin đơn hàng');
        }

        const orderData = await orderResponse.json();
        console.log('[PaymentPage] Order data:', orderData);

        // Normalize order data
        const order = orderData.data || orderData;
        const totalAmount = order.total_price || order.TotalPrice || 0;
        const email = authUser?.email || '';

        // Create checkout session
        const sessionResponse = await fetch('/api/payment/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
            amount: totalAmount,
            email,
            items: order.items || [],
          }),
        });

        if (!sessionResponse.ok) {
          const error = await sessionResponse.json();
          throw new Error(error.error || 'Không thể tạo session thanh toán');
        }

        const sessionData = await sessionResponse.json();
        console.log('[PaymentPage] Session created:', sessionData);

        if (sessionData.url) {
          setCheckoutUrl(sessionData.url);
          // Auto redirect to Stripe
          window.location.href = sessionData.url;
        } else {
          throw new Error('Không nhận được URL thanh toán');
        }
      } catch (error) {
        console.error('[PaymentPage] Error:', error);
        showError((error as any)?.message || 'Có lỗi xảy ra');
        setLoading(false);
      }
    };

    createCheckoutSession();
  }, [orderId, authUser?.email, router, showError]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Đang chuyển hướng...
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Vui lòng chờ, chúng tôi đang chuẩn bị trang thanh toán
        </p>
        
        {checkoutUrl && (
          <div className="mt-8">
            <a
              href={checkoutUrl}
              className="inline-block bg-blue-600 dark:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-800 transition"
            >
              Chuyển đến trang thanh toán
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
