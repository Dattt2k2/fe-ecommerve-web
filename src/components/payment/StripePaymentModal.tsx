'use client';

import { useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useToast } from '@/context/ToastContext';

interface PaymentModalProps {
  isOpen: boolean;
  orderId: string;
  amount: number;
  email: string;
  onSuccess: (paymentIntentId: string) => void;
  onClose: () => void;
}

// Inner component that uses Stripe hooks
function PaymentForm({
  orderId,
  amount,
  email,
  onSuccess,
  onClose,
}: Omit<PaymentModalProps, 'isOpen'>) {
  const stripe = useStripe();
  const elements = useElements();
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  // Create payment intent when modal opens
  useEffect(() => {
    if (!orderId || !amount) {
      console.warn('[PaymentForm] Missing orderId or amount:', { orderId, amount });
      return;
    }

    const createPaymentIntent = async () => {
      try {
        console.log('[PaymentForm] Creating payment intent:', { orderId, amount, email });
        const response = await fetch('/api/payment/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Math.round(amount),
            orderId,
            email,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create payment intent');
        }

        const data = await response.json();
        console.log('[PaymentForm] Payment intent created:', data);
        setClientSecret(data.client_secret);
      } catch (error: any) {
        console.error('[PaymentForm] Error creating payment intent:', error);
        showError(`Không thể tạo payment intent: ${error.message}`);
        onClose();
      }
    };

    createPaymentIntent();
  }, [orderId, amount, email, showError, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      showError('Stripe chưa được load');
      return;
    }

    if (!clientSecret) {
      showError('Payment intent chưa được tạo');
      return;
    }

    setLoading(true);

    try {
      // Confirm payment
      const result = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success?order_id=${orderId}`,
        },
        redirect: 'if_required',
      });

      if (result.error) {
        showError(result.error.message || 'Thanh toán thất bại');
        console.error('[PaymentForm] Payment error:', result.error);
        setLoading(false);
      } else if (result.paymentIntent) {
        // Payment succeeded or requires further action
        console.log('[PaymentForm] Payment intent status:', result.paymentIntent.status);
        
        if (result.paymentIntent.status === 'succeeded') {
          showSuccess('Thanh toán thành công!');
          onSuccess(result.paymentIntent.id);
          onClose();
        } else if (result.paymentIntent.status === 'processing') {
          showSuccess('Thanh toán đang được xử lý...');
          onSuccess(result.paymentIntent.id);
          onClose();
        } else if (result.paymentIntent.status === 'requires_payment_method') {
          showError('Vui lòng nhập thông tin thanh toán');
          setLoading(false);
        }
      }
    } catch (error: any) {
      console.error('[PaymentForm] Submit error:', error);
      showError('Có lỗi xảy ra khi xử lý thanh toán');
      setLoading(false);
    }
  };

  // Hiển thị loading khi tạo payment intent
  if (!clientSecret) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        <p className="text-center text-gray-600 dark:text-gray-400">Đang chuẩn bị thanh toán...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || !stripe || !elements || !clientSecret}
          className={`flex-1 py-3 rounded-lg font-semibold text-white transition ${
            loading || !stripe || !elements || !clientSecret
              ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
              : 'bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800'
          }`}
        >
          {loading ? 'Đang xử lý...' : `Thanh Toán ${amount.toLocaleString()} VND`}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-6 py-3 rounded-lg font-semibold text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}

// Main component with Elements provider
export default function StripePaymentModal({
  isOpen,
  orderId,
  amount,
  email,
  onSuccess,
  onClose,
}: PaymentModalProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (pk) {
      setStripePromise(loadStripe(pk));
    }
  }, []);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Thanh Toán
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Số tiền: <span className="font-bold text-blue-600 dark:text-blue-400">
              {amount.toLocaleString()} VND
            </span>
          </p>
        </div>

        {stripePromise ? (
          <Elements
            stripe={stripePromise}
            options={{
              appearance: {
                theme: 'stripe',
                variables: {
                  fontFamily: 'inherit',
                  colorPrimary: '#3b82f6',
                },
              },
            }}
          >
            <PaymentForm
              orderId={orderId}
              amount={amount}
              email={email}
              onSuccess={onSuccess}
              onClose={onClose}
            />
          </Elements>
        ) : (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Đang tải...</p>
          </div>
        )}
      </div>
    </>
  );
}
