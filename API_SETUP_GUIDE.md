# 🔗 Hướng dẫn Setup URL API Backend

## 📋 Tổng quan
Frontend Next.js này sử dụng biến môi trường `NEXT_PUBLIC_API_URL` để cấu hình kết nối đến backend API.

## ⚙️ Cách cấu hình:

### 1. **Chỉnh sửa file `.env.local`:**

```bash
# API Configuration - Thay đổi URL này để trỏ đến backend API của bạn
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### 2. **Các ví dụ cấu hình:**

#### 🏠 **Local Development:**
```bash
# Backend chạy trên port 8080
NEXT_PUBLIC_API_URL=http://localhost:8080/api

# Backend chạy trên port 3001 
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Backend chạy trên port khác
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

#### 🌐 **Production/Staging:**
```bash
# Production API
NEXT_PUBLIC_API_URL=https://api.yoursite.com/api

# Staging API  
NEXT_PUBLIC_API_URL=https://staging-api.yoursite.com/api

# Vercel/Netlify deployment
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app/api
```

#### 🐳 **Docker/Container:**
```bash
# Docker container
NEXT_PUBLIC_API_URL=http://backend:8080/api

# Docker compose service name
NEXT_PUBLIC_API_URL=http://api-service:3000/api
```

## 📡 **Endpoints cần có trong Backend API:**

Frontend mong đợi backend API có các endpoints sau:

### 🔐 **Authentication:**
```
POST /api/auth/login          # Đăng nhập
POST /api/auth/register       # Đăng ký  
POST /api/auth/logout         # Đăng xuất
GET  /api/auth/profile        # Lấy thông tin user
POST /api/auth/refresh        # Refresh token
```

### 📦 **Products:**
```
GET    /api/products          # Danh sách sản phẩm (có pagination, search, filter)
GET    /api/products/:id      # Chi tiết sản phẩm
POST   /api/products          # Tạo sản phẩm mới
PUT    /api/products/:id      # Cập nhật sản phẩm
DELETE /api/products/:id      # Xóa sản phẩm
GET    /api/products/search   # Tìm kiếm sản phẩm
GET    /api/products/categories # Danh sách categories
```

### 🛒 **Orders:**
```
GET    /api/orders            # Danh sách đơn hàng
GET    /api/orders/:id        # Chi tiết đơn hàng
POST   /api/orders            # Tạo đơn hàng mới
PUT    /api/orders/:id        # Cập nhật đơn hàng
GET    /api/orders/user/:userId # Đơn hàng của user
```

### 👥 **Users:**
```
GET    /api/users             # Danh sách users (admin only)
GET    /api/users/:id         # Chi tiết user
PUT    /api/users/:id         # Cập nhật user
DELETE /api/users/:id         # Xóa user
```

### 📊 **Admin:**
```
GET /api/admin/dashboard      # Dashboard stats
GET /api/admin/analytics      # Analytics data  
GET /api/admin/customers      # Customer management
```

## 🔧 **Query Parameters hỗ trợ:**

### Products:
- `?search=keyword` - Tìm kiếm
- `?category=electronics` - Filter theo category
- `?sortBy=name&sortOrder=asc` - Sắp xếp
- `?page=1&limit=10` - Phân trang

### Users:
- `?search=keyword` - Tìm kiếm theo tên/email
- `?status=active` - Filter theo trạng thái
- `?role=customer` - Filter theo role
- `?page=1&limit=10` - Phân trang

## 🚀 **Restart sau khi thay đổi:**

Sau khi thay đổi `.env.local`, cần restart Next.js dev server:

```bash
# Dừng server (Ctrl+C)
# Sau đó chạy lại:
npm run dev
```

## 🧪 **Test API Connection:**

1. Chạy ứng dụng: `npm run dev`
2. Truy cập: `http://localhost:3000/test-api`
3. Test các API endpoints
4. Kiểm tra kết nối trong console

## 🔍 **Debug API Issues:**

### Kiểm tra URL hiện tại:
- Truy cập `/test-api` page
- Xem "API Configuration" section
- Kiểm tra API Base URL

### Common Issues:
1. **CORS Error**: Backend cần enable CORS
2. **404 Error**: Kiểm tra endpoint paths
3. **401 Error**: Kiểm tra authentication
4. **Network Error**: Kiểm tra backend có chạy không

## 📝 **Ví dụ Response Format:**

Backend API nên trả về format như sau:

### Success Response:
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

### Error Response:
```json
{
  "error": true,
  "message": "Error description"
}
```

---

✅ **Lưu ý:** Biến `NEXT_PUBLIC_API_URL` sẽ được expose ra client-side, nên chỉ dùng cho public API endpoints.
