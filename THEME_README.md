# Theme System - ShopVN E-commerce

## Tính năng Theme Dark/Light Mode

Dự án e-commerce ShopVN được tích hợp hệ thống theme hoàn chỉnh với 3 chế độ:

### 🌞 Light Mode
- Giao diện sáng với nền trắng
- Phù hợp sử dụng ban ngày
- Dễ đọc trong môi trường sáng

### 🌙 Dark Mode  
- Giao diện tối với nền đen
- Bảo vệ mắt trong môi trường tối
- Tiết kiệm pin cho thiết bị OLED

### 💻 System Mode
- Tự động theo cài đặt hệ thống
- Thay đổi theo preference của trình duyệt
- Sync với Dark Mode của Windows/macOS

## Cách sử dụng

### 1. Chuyển đổi theme
- Click vào icon theme ở header (sun/moon/monitor)
- Chọn theme mong muốn từ dropdown
- Hoặc sử dụng ThemeTester component

### 2. Lập trình
```typescript
import { useTheme } from '@/context/ThemeContext';

function MyComponent() {
  const { theme, actualTheme, setTheme, toggleTheme } = useTheme();
  
  return (
    <div className="bg-white dark:bg-gray-800">
      Current theme: {actualTheme}
    </div>
  );
}
```

### 3. CSS Classes
```css
/* Light mode */
.bg-white

/* Dark mode */  
.dark:bg-gray-800

/* Responsive to both */
.bg-white.dark:bg-gray-800
```

## Cấu trúc Files

### Core Files
- `src/context/ThemeContext.tsx` - Theme context và logic
- `src/components/ui/ThemeToggle.tsx` - Dropdown theme selector
- `src/components/ui/ThemeToggleButton.tsx` - Simple toggle button
- `tailwind.config.ts` - Cấu hình dark mode
- `src/app/globals.css` - Theme styles

### Components
- `ThemeStatus` - Hiển thị trạng thái theme
- `ThemeTester` - Test theme switching
- `Header` - Tích hợp theme toggle

### Demo Pages
- `/theme-demo` - Trang demo đầy đủ tính năng theme
- `/` - Trang chủ với theme support
- `/auth/*` - Các trang auth với dark mode

## Tính năng đặc biệt

### ✅ System Detection
- Tự động detect Dark Mode của hệ thống
- Listen thay đổi preference realtime
- Fallback về Light mode nếu không detect được

### ✅ LocalStorage Persistence  
- Lưu lựa chọn theme của user
- Restore theme khi reload page
- Default 'system' cho user mới

### ✅ SSR Safe
- Prevent hydration mismatch
- Loading states cho theme components
- SuppressHydrationWarning

### ✅ Smooth Transitions
- CSS transitions cho tất cả color changes
- Không bị flicker khi chuyển theme
- Custom scrollbar cho dark mode

### ✅ Accessibility
- Proper ARIA labels
- Keyboard navigation support
- High contrast colors
- Focus indicators

## Testing

### Manual Testing
1. Truy cập `/theme-demo`
2. Test 3 theme modes
3. Thay đổi system preference
4. Reload page để test persistence

### System Theme Testing
**Windows:**
- Settings > Personalization > Colors > Choose your color
- Chọn "Dark" hoặc "Light"

**macOS:**  
- System Preferences > General > Appearance
- Chọn "Dark" hoặc "Light"

**Browser:**
- Chrome DevTools > Rendering > Emulate CSS prefers-color-scheme

## Components có Theme Support

### ✅ Layout
- Header với theme toggle
- Navigation responsive
- Footer (sẽ thêm)

### ✅ Authentication
- Login form với dark styling
- Register form 
- Forgot password page

### ✅ UI Components
- Buttons với dark variants
- Cards với border colors
- Form inputs dark mode
- Alerts với dark backgrounds

### 🚧 Sẽ thêm
- Product cards
- Shopping cart
- Checkout flow
- Admin dashboard

## Best Practices

### CSS Classes
```css
/* ✅ Good - Explicit dark variants */
.bg-white.dark:bg-gray-800.text-gray-900.dark:text-gray-100

/* ❌ Bad - Missing dark variants */
.bg-white.text-black

/* ✅ Good - Border colors */
.border-gray-300.dark:border-gray-600

/* ✅ Good - Hover states */
.hover:bg-gray-100.dark:hover:bg-gray-700
```

### Component Structure
```typescript
// ✅ Good - Check mounted state
function ThemeComponent() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <div>Loading...</div>;
  }
  
  return <div>Theme content</div>;
}
```

## Troubleshooting

### Theme không chuyển đổi
- Kiểm tra `tailwind.config.ts` có `darkMode: 'class'`
- Verify ThemeProvider wrap toàn bộ app trong layout.tsx
- Check console cho JavaScript errors

### Flicker khi load page
- Thêm `suppressHydrationWarning` vào html tag
- Kiểm tra CSS transitions trong globals.css
- Verify loading states cho theme components

### System theme không hoạt động
- Test trong browser có hỗ trợ `prefers-color-scheme`
- Kiểm tra MediaQuery listeners
- Verify system settings được apply đúng

## URLs để test

- **Trang chủ:** http://localhost:3001/
- **Theme Demo:** http://localhost:3001/theme-demo  
- **Login:** http://localhost:3001/auth/login
- **Register:** http://localhost:3001/auth/register
- **Forgot Password:** http://localhost:3001/auth/forgot-password

---

🎉 **Theme system đã hoàn thiện!** Bây giờ bạn có thể phát triển thêm các tính năng khác với full dark mode support.
