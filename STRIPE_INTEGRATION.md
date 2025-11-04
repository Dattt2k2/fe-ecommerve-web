# Stripe Integration Guide

## 1. Installation

```bash
npm install stripe @stripe/js
# or
yarn add stripe @stripe/js
```

## 2. Environment Variables

Thêm vào `.env.local`:
```
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

## 3. Backend Setup

Cập nhật backend để support Stripe:
- Endpoint: `/payment/create-intent` (POST)
  - Request: `{ amount, order_id, email, payment_method }`
  - Response: `{ id, client_secret, checkout_session_id, ... }`

## 4. Frontend Integration

### Option A: Stripe Checkout (Hosted)
Dùng `StripeCheckout.tsx` component để redirect tới Stripe Checkout page

### Option B: Payment Elements (Embedded)
Tạo component với Payment Elements form để embed trực tiếp

## 5. Payment Flow

```
1. User click "Thanh Toán Với Stripe"
   ↓
2. Frontend call `/api/payment/create-payment-intent`
   ↓
3. API proxy tới backend `/payment/create-intent`
   ↓
4. Backend create Stripe PaymentIntent
   ↓
5. Frontend redirect tới Stripe or show Payment Elements
   ↓
6. User complete payment on Stripe
   ↓
7. Webhook confirms payment → Update order status
```

## 6. Webhook Setup

Backend cần setup webhook listener tại: `/webhook/stripe`
- Nghe events: `payment_intent.succeeded`, `payment_intent.failed`
- Update order status sau khi payment succeeded

## 7. Order Page Integration

```tsx
// In order/page.tsx
<StripeCheckout
  orderId={orderResponse.orderId}
  amount={totalPayment}
  email={userInfo.email}
  onSuccess={(paymentIntentId) => {
    console.log('Payment successful:', paymentIntentId);
    router.push(`/order/${orderResponse.orderId}`);
  }}
/>
```

## 8. Payment Method Options

```tsx
// Current: DIRECT_PAYMENT → Stripe
{
  value: 'direct_payment',
  label: 'Thẻ Tín Dụng (Stripe)',
  handler: StripeCheckout
}
```

## Status Flow

```
PROCESSING (Chờ xác nhận) 
   ↓ (Payment via Stripe)
PAYMENT_PENDING (Chờ xác nhận thanh toán)
   ↓ (Payment succeeded)
PROCESSING (Chờ người bán xác nhận)
   ↓
SHIPPED (Đã giao)
   ↓
DELIVERED (Đã nhận)
```
