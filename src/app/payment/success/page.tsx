'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader, CheckCircle } from 'lucide-react';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const paymentId = searchParams.get('payment_intent');
    const orderId = searchParams.get('order_id');

    console.log('[PaymentSuccess] Payment completed with ID:', paymentId, 'orderId:', orderId);

    // If opened as a popup from the checkout/checkout page, send a message to the opener
    // so the opener can update state and redirect; otherwise just navigate to /my-orders.
    try {
      if (typeof window !== 'undefined' && window.opener) {
        console.log('[PaymentSuccess] Posting message to opener and closing window');
        window.opener.postMessage({ type: 'payment-success', paymentId, orderId }, window.location.origin);
        // Close this popup window immediately
        window.close();
        return; // stop further execution
      }
    } catch (err) {
      console.warn('[PaymentSuccess] Could not postMessage to opener:', err);
    }

    // If there's no opener (single-tab flow or direct redirect), immediately replace to /my-orders
    router.replace('/my-orders');
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
