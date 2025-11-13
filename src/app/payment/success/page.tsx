'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader, CheckCircle } from 'lucide-react';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const paymentId = searchParams.get('payment_intent');

    console.log('[PaymentSuccess] Payment completed with ID:', paymentId);

    // Redirect trực tiếp tới /my-orders
    const timer = setTimeout(() => {
      console.log('[PaymentSuccess] Redirecting to /my-orders');
      router.push('/my-orders');
    }, 2000);

    return () => clearTimeout(timer);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thành công!</h1>
        <p className="text-gray-600 mb-4">Đơn hàng của bạn đã được xác nhận.</p>
        <div className="flex items-center justify-center gap-2">
          <Loader className="w-4 h-4 animate-spin" />
          <p className="text-sm text-gray-500">Đang chuyển hướng...</p>
        </div>
      </div>
    </div>
  );
}
