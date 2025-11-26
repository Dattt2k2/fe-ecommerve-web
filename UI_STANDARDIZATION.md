# Hướng Dẫn Chuẩn Hóa Giao Diện Người Dùng - Dự Án ShopVN E-commerce

**Ngày tạo:** 21/11/2025  
**Phiên bản:** 1.0  
**Tác giả:** Đội ngũ phát triển ShopVN  

## Mục Lục
1. [Tổng Quan](#1-tổng-quan)
2. [Cấu Trúc và Bố Cục](#2-cấu-trúc-và-bố-cục)
3. [Quy Ước Nút và Điều Khiển](#3-quy-ước-nút-và-điều-khiển)
4. [Hiển Thị Thông Báo Phản Hồi](#4-hiển-thị-thông-báo-phản-hồi)
5. [Phối Màu](#5-phối-màu)
6. [Chuẩn Hóa Font Chữ](#6-chuẩn-hóa-font-chữ)
7. [Khả Năng Truy Cập](#7-khả-năng-truy-cập)
8. [Hoạt Ảnh và Chuyển Tiếp](#8-hoạt-ảnh-và-chuyển-tiếp)
9. [Thực Tiễn Tốt Nhất](#9-thực-tiễn-tốt-nhất)

## 1. Tổng Quan
Hướng dẫn này quy định các tiêu chuẩn thiết kế giao diện người dùng cho dự án ShopVN E-commerce. Dự án được xây dựng bằng Next.js với Tailwind CSS và hỗ trợ chế độ theme sáng/tối hoàn chỉnh.

Mục đích của hướng dẫn này là đảm bảo tính nhất quán, khả năng sử dụng và trải nghiệm người dùng thống nhất trên toàn bộ ứng dụng.

## 2. Cấu Trúc và Bố Cục
### Layout Chính
- Sử dụng App Router của Next.js với cấu trúc thư mục `src/app/`
- Thiết kế đáp ứng với các điểm ngắt: xs (475px), sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
- Container toàn chiều rộng cho các phần chính
- Header và Footer cố định

### Component Layout
- Sử dụng component Card cho các container nội dung
- Khoảng đệm chuẩn: 6 (1.5rem) cho CardHeader/CardContent
- Khoảng cách giữa các phần tử: sử dụng thang đo khoảng cách của Tailwind

### Thiết Kế Đáp Ứng
- Phương pháp ưu tiên thiết bị di động
- Sử dụng Flexbox/Grid cho bố cục
- Các lớp ẩn/hiện cho hành vi đáp ứng

## 3. Quy Ước Nút và Điều Khiển
### Component Button
Component Button cung cấp bốn biến thể chính:

#### Biến Thể:
- **Primary**: Nút chính với màu nền xanh dương, chữ trắng (CTA chính)
- **Secondary**: Nút phụ với nền xám nhạt, chữ tối (hành động phụ)
- **Outline**: Nút viền với đường viền xám, nền trong suốt
- **Ghost**: Nút tối giản với hiệu ứng hover nhẹ

#### Kích Thước:
- **sm**: Chiều cao 8, padding ngang 3, chữ nhỏ
- **md**: Chiều cao 10, padding ngang 4 (mặc định)
- **lg**: Chiều cao 12, padding ngang 6, chữ lớn

### Trường Nhập Dữ Liệu
- Sử dụng phần tử HTML input với các lớp Tailwind
- Kiểu cơ bản: chiều rộng đầy đủ, padding dọc-ngang, viền xám, bo góc trung bình
- Trạng thái focus: vòng viền màu chính, không có viền ngoài
- Chế độ tối: nền tối, viền tối, chữ trắng
- Trạng thái xác thực: viền đỏ cho lỗi, viền xanh cho thành công

### Biểu Tượng
- **Lucide React**: Thư viện biểu tượng chính (CheckCircle, AlertCircle, X, v.v.)
- **Material Icons**: Biểu tượng đặc biệt từ Google Fonts
- Kích thước chuẩn: 16px, 20px, 24px
- Màu sắc: xám nhạt cho muted, màu chính cho nhấn mạnh

### Thành Phần Tương Tác
- Trạng thái hover: độ trong suốt 70% hoặc thay đổi màu nền
- Trạng thái focus: vòng viền 2px với màu phù hợp
- Trạng thái disabled: độ trong suốt 50%, vô hiệu hóa sự kiện
- Trạng thái loading: vòng quay hoặc khung xương

## 4. Hiển Thị Thông Báo Phản Hồi
### Component Toast
Component Toast hiển thị thông báo với bốn loại:

#### Loại Thông Báo:
- **Thành công**: Nền xanh nhạt, viền xanh, biểu tượng CheckCircle
- **Lỗi**: Nền đỏ nhạt, viền đỏ, biểu tượng AlertCircle
- **Cảnh báo**: Nền vàng nhạt, viền vàng, biểu tượng AlertCircle
- **Thông tin**: Nền xanh dương nhạt, viền xanh dương, biểu tượng Info

#### Hành Vi:
- Vị trí: cố định trên cùng bên phải
- Hoạt ảnh: trượt vào từ bên phải trong 0.3 giây
- Tự động đóng sau thời gian quy định (mặc định 5 giây)
- Đóng thủ công bằng nút X

### Trạng Thái Đang Tải
- Vòng quay: hoạt ảnh xoay cho biểu tượng
- Khung xương: nền xám với hiệu ứng nhấp nháy cho nội dung đang tải
- Nút đang tải: vô hiệu hóa với vòng quay bên trong

## 5. Phối Màu
### Màu Chính
- **Màu chính**: #ff5722 (Cam) - cho các nút kêu gọi hành động, điểm nhấn
- **Nền**: #ffffff (Sáng) / #0a0a0a (Tối)
- **Chữ**: #171717 (Sáng) / #ededed (Tối)

### Màu Theme (Cấu Hình Tailwind)
```
primary: {
  DEFAULT: '#ff5722',
  50: '#fff3ef', 100: '#ffe6dc', 200: '#ffc8ad',
  300: '#ffa77e', 400: '#ff8a4f', 500: '#ff5722',
  600: '#e04b2a', 700: '#b93b22', 800: '#8f2e1a', 900: '#6b2213'
}
dark: {
  50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0',
  300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b',
  600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a'
}
surface: {
  DEFAULT: '#ffffff',
  muted: '#f8f8f8'
}
```

### Hướng Dẫn Sử Dụng
- Màu chính: Nút, liên kết, điểm nổi bật
- Màu tối: Chữ, viền, nền tinh tế
- Màu bề mặt: Nền thẻ, nền modal
- Màu ngữ nghĩa: Xanh (thành công), Đỏ (lỗi), Vàng (cảnh báo), Xanh dương (thông tin)

## 6. Chuẩn Hóa Font Chữ
### Họ Font
- **Sans**: Geist Sans (chính), ui-sans-serif, system-ui
- **Mono**: Geist Mono (mã), ui-monospace, SFMono-Regular
- **Dự phòng**: Arial, Helvetica, sans-serif (thân)

### Kích Thước Chữ (Tailwind)
- **xs**: 0.75rem (12px)
- **sm**: 0.875rem (14px)
- **base**: 1rem (16px) - mặc định
- **lg**: 1.125rem (18px)
- **xl**: 1.25rem (20px)
- **2xl**: 1.5rem (24px)
- **3xl**: 1.875rem (30px)
- **4xl**: 2.25rem (36px)

### Độ Đậm Font
- **normal**: 400
- **medium**: 500
- **semibold**: 600
- **bold**: 700

### Hướng Dẫn Sử Dụng
- Tiêu đề: semibold hoặc bold
- Nội dung: normal
- Nút: medium
- Mã: mono

## 7. Khả Năng Truy Cập
- Chỉ báo focus: focus-visible:ring-2
- Nhãn ARIA cho phần tử tương tác
- Tỷ lệ tương phản màu: tuân thủ WCAG AA
- Hỗ trợ điều hướng bàn phím

## 8. Hoạt Ảnh và Chuyển Tiếp
- Thời gian chuyển tiếp: 0.2 giây ease-in-out (phai vào)
- Hoạt ảnh trượt: 0.3 giây ease-out
- Chuyển tiếp hover: 0.15 giây ease
- Không nhấp nháy khi chuyển theme

## 9. Thực Tiễn Tốt Nhất
- Sử dụng biến CSS cho màu theme
- Khoảng cách nhất quán với thang đo Tailwind
- Phương pháp dựa trên component với các thành phần UI có thể tái sử dụng
- Hỗ trợ chế độ tối cho tất cả component
- Thiết kế đáp ứng trên thiết bị di động
- Hiệu suất: tối ưu hóa kích thước bundle, tải lười
- Body text: font-normal
- Buttons: font-medium
- Code: font-mono

## 6. Accessibility
- Focus indicators: focus-visible:ring-2
- ARIA labels cho interactive elements
- Color contrast ratios: đảm bảo WCAG AA compliance
- Keyboard navigation support

## 7. Animations & Transitions
- Transition duration: 0.2s ease-in-out (fade-in)
- Slide animations: 0.3s ease-out
- Hover transitions: 0.15s ease
- No flash/flicker khi chuyển theme

## 8. Best Practices
- Sử dụng CSS variables cho theme colors
- Consistent spacing với Tailwind scale
- Component-based approach với reusable UI components
- Dark mode support cho tất cả components
- Mobile-responsive design
- Performance: optimize bundle size, lazy loading</content>
<parameter name="filePath">c:\Users\dat\fe-e_commerce_app\UI_STANDARDIZATION.md