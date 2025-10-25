'use client';

import Link from 'next/link';
import { ArrowLeft, Home, Search, ShoppingBag } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mb-6">
            <ShoppingBag className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
          
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
            404
          </h1>
          
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Sản phẩm không tồn tại
          </h2>
          
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Sản phẩm bạn đang tìm kiếm có thể đã bị xóa, hết hàng hoặc không tồn tại.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/products"
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Search className="w-5 h-5 mr-2" />
            Xem tất cả sản phẩm
          </Link>
          
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            Về trang chủ
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center w-full px-6 py-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Quay lại trang trước
          </button>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            <strong>Gợi ý:</strong> Kiểm tra lại đường dẫn hoặc tìm kiếm sản phẩm tương tự.
          </p>
        </div>
      </div>
    </div>
  );
}