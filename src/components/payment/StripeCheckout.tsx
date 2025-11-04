'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/js';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';

interface StripeCheckoutProps {
  orderId: string;
  amount: number;
  email: string;
  onSuccess?: (paymentIntentId: string) => void;
  onCancel?: () => void;
}

export default function StripeCheckout({
  orderId,
  amount,
  email,
  onSuccess,
  onCancel,
}: StripeCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess } = useToast();
  const router = useRouter();

  const handleStripeCheckout = async () => {
    try {
      setLoading(true);

      // Get Stripe public key from environment
      const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (!stripePublishableKey) {
        throw new Error('Stripe configuration missing');
      }

      // Load Stripe
      const stripe = await loadStripe(stripePublishableKey);
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      // Create payment intent via our API
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

      const paymentData = await response.json();
      console.log('Payment intent created:', paymentData);

      // Redirect to Stripe checkout or use payment elements
      if (paymentData.checkout_session_id) {
        // If using Stripe Checkout Session
        const { error } = await stripe.redirectToCheckout({
          sessionId: paymentData.checkout_session_id,
        });
        
        if (error) {
          throw new Error(error.message);
        }
      } else if (paymentData.client_secret) {
        // If using Payment Intent, redirect to confirmation page
        onSuccess?.(paymentData.id);
        showSuccess('Payment intent created. Redirecting to payment confirmation...');
        // Redirect to a confirmation page that will use Payment Elements
        router.push(`/payment/confirm?payment_intent=${paymentData.id}&client_secret=${paymentData.client_secret}`);
      }
    } catch (error: any) {
      console.error('Stripe checkout error:', error);
      showError(error.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          <strong>Số tiền thanh toán:</strong> {amount.toLocaleString()} VND
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleStripeCheckout}
          disabled={loading}
          className={`flex-1 py-3 rounded-lg font-semibold text-white transition ${
            loading
              ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
              : 'bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800'
          }`}
        >
          {loading ? 'Đang xử lý...' : 'Thanh Toán Với Stripe'}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-3 rounded-lg font-semibold text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50"
          >
            Hủy
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Thanh toán được bảo mật bởi Stripe
      </p>
    </div>
  );
}
