# Orders API Documentation

## Overview
Tài liệu này mô tả các API endpoints để quản lý đơn hàng trong hệ thống e-commerce.

## API Endpoints

### 1. Tạo đơn hàng từ giỏ hàng
**POST** `/api/orders/cart`

Tạo đơn hàng từ các sản phẩm trong giỏ hàng của người dùng.

**Request Body:**
```json
{
  "shippingAddress": {
    "fullName": "Nguyễn Văn A",
    "phone": "0123456789",
    "address": "123 Đường ABC",
    "city": "Hà Nội",
    "district": "Hoàn Kiếm",
    "ward": "Phường 1"
  },
  "paymentMethod": "COD",
  "note": "Ghi chú đơn hàng"
}
```

**Response:**
```json
{
  "message": "Order created successfully",
  "order": {
    "id": "order_123",
    "userId": "user_456",
    "items": [...],
    "total": 500000,
    "status": "pending",
    "createdAt": "2025-11-02T10:00:00Z"
  }
}
```

**Usage Example:**
```typescript
import { ordersAPI } from '@/lib/api';

const orderData = {
  shippingAddress: {
    fullName: "Nguyễn Văn A",
    phone: "0123456789",
    address: "123 Đường ABC",
    city: "Hà Nội",
    district: "Hoàn Kiếm",
    ward: "Phường 1"
  },
  paymentMethod: "COD",
  note: "Giao hàng giờ hành chính"
};

const result = await ordersAPI.createOrderFromCart(orderData);
```

---

### 2. Tạo đơn hàng trực tiếp (Mua ngay)
**POST** `/api/orders/direct`

Tạo đơn hàng trực tiếp mà không cần thêm vào giỏ hàng trước.

**Request Body:**
```json
{
  "productId": "prod_123",
  "quantity": 2,
  "shippingAddress": {
    "fullName": "Nguyễn Văn A",
    "phone": "0123456789",
    "address": "123 Đường ABC",
    "city": "Hà Nội",
    "district": "Hoàn Kiếm",
    "ward": "Phường 1"
  },
  "paymentMethod": "COD",
  "note": "Ghi chú đơn hàng"
}
```

**Response:**
```json
{
  "message": "Order created successfully",
  "order": {
    "id": "order_124",
    "userId": "user_456",
    "items": [...],
    "total": 300000,
    "status": "pending",
    "createdAt": "2025-11-02T10:05:00Z"
  }
}
```

**Usage Example:**
```typescript
import { ordersAPI } from '@/lib/api';

const orderData = {
  productId: "prod_123",
  quantity: 2,
  shippingAddress: {
    fullName: "Nguyễn Văn A",
    phone: "0123456789",
    address: "123 Đường ABC",
    city: "Hà Nội"
  },
  paymentMethod: "COD"
};

const result = await ordersAPI.createOrderDirect(orderData);
```

---

### 3. Lấy danh sách đơn hàng của người dùng
**GET** `/api/orders/user`

Lấy tất cả đơn hàng của người dùng hiện tại (người dùng đang đăng nhập).

**Response:**
```json
{
  "orders": [
    {
      "id": "order_123",
      "items": [...],
      "total": 500000,
      "status": "pending",
      "createdAt": "2025-11-02T10:00:00Z"
    }
  ]
}
```

**Usage Example:**
```typescript
import { ordersAPI } from '@/lib/api';

const { orders } = await ordersAPI.getUserOrders();
```

---

### 4. Lấy tất cả đơn hàng (Admin)
**GET** `/api/orders`

Lấy tất cả đơn hàng trong hệ thống (chỉ dành cho admin).

**Query Parameters:**
- `page`: Số trang (mặc định: 1)
- `limit`: Số lượng đơn hàng mỗi trang (mặc định: 10)
- `status`: Lọc theo trạng thái (pending, processing, shipped, delivered, cancelled)

**Response:**
```json
{
  "orders": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
```

**Usage Example:**
```typescript
import { ordersAPI } from '@/lib/api';

const { orders, pagination } = await ordersAPI.getOrders({ 
  page: '1', 
  limit: '10',
  status: 'pending'
});
```

---

### 5. Hủy đơn hàng
**POST** `/api/orders/cancel/[orderId]`

Hủy đơn hàng (chỉ người dùng sở hữu đơn hàng mới có thể hủy).

**URL Parameters:**
- `orderId`: ID của đơn hàng cần hủy

**Response:**
```json
{
  "message": "Order cancelled successfully"
}
```

**Usage Example:**
```typescript
import { ordersAPI } from '@/lib/api';

await ordersAPI.cancelOrder('order_123');
```

---

### 6. Lấy chi tiết đơn hàng
**GET** `/api/orders/[id]`

Lấy thông tin chi tiết của một đơn hàng.

**URL Parameters:**
- `id`: ID của đơn hàng

**Response:**
```json
{
  "order": {
    "id": "order_123",
    "userId": "user_456",
    "items": [
      {
        "productId": "prod_123",
        "productName": "Sản phẩm A",
        "quantity": 2,
        "price": 100000,
        "subtotal": 200000
      }
    ],
    "total": 500000,
    "status": "pending",
    "shippingAddress": {...},
    "createdAt": "2025-11-02T10:00:00Z",
    "updatedAt": "2025-11-02T10:00:00Z"
  }
}
```

**Usage Example:**
```typescript
import { ordersAPI } from '@/lib/api';

const { order } = await ordersAPI.getOrder('order_123');
```

---

## Order Status Flow

```
pending → processing → shipped → delivered
   ↓
cancelled
```

- **pending**: Đơn hàng mới tạo, chờ xác nhận
- **processing**: Đơn hàng đang được xử lý/đóng gói
- **shipped**: Đơn hàng đã giao cho đơn vị vận chuyển
- **delivered**: Đơn hàng đã giao thành công
- **cancelled**: Đơn hàng đã bị hủy

---

## Authorization

Tất cả các API endpoints đều yêu cầu authentication token:

```typescript
// Token sẽ được tự động thêm vào header bởi apiClient
// Hoặc từ cookie 'auth-token'
headers: {
  'Authorization': 'Bearer <your-token>'
}
```

---

## Error Handling

**401 Unauthorized:**
```json
{
  "error": "Authorization required"
}
```

**404 Not Found:**
```json
{
  "error": "Order not found"
}
```

**400 Bad Request:**
```json
{
  "error": "Invalid order data"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to process order"
}
```

---

## Complete Usage Example in React Component

```typescript
'use client';

import { useState } from 'react';
import { ordersAPI } from '@/lib/api';

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  
  const handleCheckoutFromCart = async () => {
    setLoading(true);
    try {
      const orderData = {
        shippingAddress: {
          fullName: "Nguyễn Văn A",
          phone: "0123456789",
          address: "123 Đường ABC",
          city: "Hà Nội",
          district: "Hoàn Kiếm",
          ward: "Phường 1"
        },
        paymentMethod: "COD",
        note: "Giao giờ hành chính"
      };
      
      const result = await ordersAPI.createOrderFromCart(orderData);
      console.log('Order created:', result.order);
      
      // Redirect to success page
      window.location.href = `/checkout/success?orderId=${result.order.id}`;
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Có lỗi xảy ra khi tạo đơn hàng');
    } finally {
      setLoading(false);
    }
  };
  
  const handleBuyNow = async (productId: string, quantity: number) => {
    setLoading(true);
    try {
      const orderData = {
        productId,
        quantity,
        shippingAddress: {
          fullName: "Nguyễn Văn A",
          phone: "0123456789",
          address: "123 Đường ABC",
          city: "Hà Nội"
        },
        paymentMethod: "COD"
      };
      
      const result = await ordersAPI.createOrderDirect(orderData);
      console.log('Order created:', result.order);
      
      window.location.href = `/checkout/success?orderId=${result.order.id}`;
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Có lỗi xảy ra khi tạo đơn hàng');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <button onClick={handleCheckoutFromCart} disabled={loading}>
        {loading ? 'Đang xử lý...' : 'Thanh toán'}
      </button>
    </div>
  );
}
```

---

## Notes

1. Tất cả các API đều proxy qua Next.js API routes để xử lý authentication và CORS
2. Backend URL được cấu hình trong `process.env.API_URL`
3. Token authentication được xử lý tự động bởi `apiClient`
4. Các route tương ứng với backend Go:
   - `/api/orders/cart` → `/order/cart`
   - `/api/orders/direct` → `/order/direct`
   - `/api/orders/user` → `/order/user`
   - `/api/orders` → `/admin/orders`
   - `/api/orders/cancel/[orderId]` → `/order/cancel/:order_id`
5. **Quan trọng**: 
   - `/order/user` là endpoint để lấy orders của user hiện tại (đã authenticated)
   - `/admin/orders` là endpoint để admin lấy tất cả orders trong hệ thống
