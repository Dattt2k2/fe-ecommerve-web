'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { StripeProvider } from '@/components/payment/StripeProvider';
import StripePaymentModal from '@/components/payment/StripePaymentModal';
import { useToast } from '@/context/ToastContext';
import { CreditCard, Loader } from 'lucide-react';

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const { showError, showSuccess } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    orderId: '',
    amount: 0,
    email: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get payment details from URL parameters
    const order_id = searchParams.get('order_id');
    const amount = searchParams.get('amount');
    const email = searchParams.get('email');
    
    // Lấy order_id từ localStorage (được set bởi checkout page)
    const savedOrderId = typeof window !== 'undefined' ? localStorage.getItem('current_order_id') : null;
    const orderId = order_id || savedOrderId || '';

    console.log('[PaymentPage] URL params:', { order_id, amount, email });
    console.log('[PaymentPage] Saved order_id from localStorage:', savedOrderId);

    if (orderId && amount && email) {
      setPaymentData({
        orderId,
        amount: parseFloat(amount),
        email,
      });
      setIsModalOpen(true);
    } else {
      console.error('[PaymentPage] Missing required params:', { orderId, amount, email });
      showError('Thông tin thanh toán không hoàn chỉnh');
      setTimeout(() => {
        window.close();
      }, 2000);
    }
    setIsLoading(false);
  }, [searchParams, showError]);

  const handlePaymentSuccess = (paymentIntentId: string) => {
    // Thanh toán thành công sẽ được xử lý bởi /payment/success page
    // Callback này được gọi nếu Stripe không redirect (redirect: 'if_required')
    console.log('[PaymentPage] Payment success callback:', paymentIntentId);
    showSuccess('Thanh toán thành công!');
    setIsModalOpen(false);
    
    // Gửi message về tab gốc
    if (window.opener) {
      window.opener.postMessage(
        { type: 'payment-success', paymentId: paymentIntentId, orderId: paymentData.orderId },
        window.location.origin
      );
    }
    
    // Đóng tab
    setTimeout(() => {
      window.close();
    }, 1500);
  };

  const handlePaymentClose = () => {
    console.log('[PaymentPage] User cancelled payment');
    setIsModalOpen(false);
    // Close this tab when user cancels
    setTimeout(() => {
      window.close();
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading payment...</p>
        </div>
      </div>
    );
  }

  return (
    <StripeProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <CreditCard className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment</h1>
            <p className="text-gray-600 mb-6">
              {paymentData.amount > 0
                ? `Complete your payment of $${(paymentData.amount / 100).toFixed(2)}`
                : 'Processing your payment...'}
            </p>
          </div>
        </div>

        <StripePaymentModal
          isOpen={isModalOpen}
          orderId={paymentData.orderId}
          amount={paymentData.amount}
          email={paymentData.email}
          onSuccess={handlePaymentSuccess}
          onClose={handlePaymentClose}
        />
      </div>
    </StripeProvider>
  );
}
