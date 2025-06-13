// src/app/auth/login/page.tsx
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">ShopVN</h1>
          <p className="text-gray-600">Nền tảng mua sắm trực tuyến hàng đầu</p>
        </div>
      </div>
      
      <div className="mt-8 sm:mx-auto sm:w-full">
        <LoginForm />
      </div>
    </div>
  );
}