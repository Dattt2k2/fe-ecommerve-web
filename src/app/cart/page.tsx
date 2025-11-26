'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { Minus, Plus, X, ShoppingBag, ArrowLeft, AlertCircle, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

type DeleteAction = 'clear' | 'item' | 'quantity';

export default function CartPage() {
  const { items, total, itemCount, updateQuantity, removeFromCart, clearCart } = useCart();
  const [error, setError] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAction, setDeleteAction] = useState<DeleteAction | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  
  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    // Nếu số lượng về 0, hiển thị modal xác nhận
    if (newQuantity === 0) {
      setDeleteAction('quantity');
      setDeleteItemId(itemId);
      setShowDeleteModal(true);
      return;
    }
    
    const result = await updateQuantity(itemId, newQuantity);
    if (!result.success) {
      setError(result.message || 'Có lỗi xảy ra');
      setTimeout(() => setError(''), 5000);
    }
  };
  
  const handleRemoveItem = async (itemId: string) => {
    setDeleteAction('item');
    setDeleteItemId(itemId);
    setShowDeleteModal(true);
  };
  
  const handleClearCart = async () => {
    setDeleteAction('clear');
    setDeleteItemId(null);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (deleteAction === 'clear') {
      const result = await clearCart();
      if (!result.success) {
        setError(result.message || 'Có lỗi xảy ra');
        setTimeout(() => setError(''), 5000);
      }
    } else if (deleteAction === 'item' && deleteItemId) {
      const result = await removeFromCart(deleteItemId);
      if (!result.success) {
        setError(result.message || 'Có lỗi xảy ra');
        setTimeout(() => setError(''), 5000);
      }
    } else if (deleteAction === 'quantity' && deleteItemId) {
      const result = await updateQuantity(deleteItemId, 0);
      if (!result.success) {
        setError(result.message || 'Có lỗi xảy ra');
        setTimeout(() => setError(''), 5000);
      }
    }
    
    setShowDeleteModal(false);
    setDeleteAction(null);
    setDeleteItemId(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteAction(null);
    setDeleteItemId(null);
  };

  const getDeleteMessage = () => {
    if (deleteAction === 'clear') {
      return 'Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi giỏ hàng?';
    } else if (deleteAction === 'item' || deleteAction === 'quantity') {
      const item = items.find(i => i.id === deleteItemId);
      return `Bạn có chắc chắn muốn xóa "${item?.product.name}" khỏi giỏ hàng?`;
    }
    return '';
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-16">
          <ShoppingBag className="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Giỏ hàng trống
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá các sản phẩm của chúng tôi!
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Error Message */}
      {error && (
        <div className="mb-6 flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Giỏ hàng ({itemCount} sản phẩm)
        </h1>
        <button
          onClick={handleClearCart}
          className="text-red-600 hover:text-red-700 text-sm font-medium"
        >
          Xóa tất cả
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-start gap-4">
                {/* Product Image */}
                <Link href={`/products/${item.product.id}`} className="flex-shrink-0">
                  <div className="w-20 h-20 relative rounded-lg overflow-hidden">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </Link>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.product.id}`}>
                    <h3 className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2">
                      {item.product.name}
                    </h3>
                  </Link>
                  
                  <div className="mt-1 space-y-1">
                    {item.size && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Kích thước: {item.size}
                      </p>
                    )}
                    {item.color && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Màu sắc: {item.color}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        className="p-1 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium text-gray-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="p-1 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="font-bold text-lg text-blue-600 dark:text-blue-400">
                        {formatPrice(item.product.price * item.quantity)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatPrice(item.product.price)} x {item.quantity}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Tóm tắt đơn hàng
            </h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Tạm tính ({itemCount} sản phẩm):
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatPrice(total)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Phí vận chuyển:</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  Miễn phí
                </span>
              </div>
              
              <hr className="border-gray-200 dark:border-gray-700" />
              
              <div className="flex justify-between text-lg font-bold">
                <span className="text-gray-900 dark:text-white">Tổng cộng:</span>
                <span className="text-blue-600 dark:text-blue-400">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            {/* Discount Code */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mã giảm giá
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã giảm giá"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                />
                <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm">
                  Áp dụng
                </button>
              </div>
            </div>

            {/* Checkout Button */}
            <Link
              href="/order"
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-center block"
            >
              Tiến hành thanh toán
            </Link>

            {/* Continue Shopping */}
            <Link
              href="/"
              className="w-full mt-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium text-center block"
            >
              Tiếp tục mua sắm
            </Link>

            {/* Security Info */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                🔒 Thanh toán an toàn và bảo mật
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Xác nhận xóa
              </h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {getDeleteMessage()}
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
