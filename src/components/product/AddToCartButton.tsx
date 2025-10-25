'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types';
import { ShoppingCart, Plus, Minus, Check, AlertCircle } from 'lucide-react';

interface AddToCartButtonProps {
  product: Product;
  showQuantitySelector?: boolean;
  buttonText?: string;
  className?: string;
}

export default function AddToCartButton({ 
  product, 
  showQuantitySelector = true,
  buttonText = "Thêm vào giỏ hàng",
  className = ""
}: AddToCartButtonProps) {
  const { addToCart, isInCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = async () => {
    if (product.stock <= 0) return;
    
    setIsLoading(true);
    setError('');
    
    const result = await addToCart(product, quantity, {
      size: selectedSize || undefined,
      color: selectedColor || undefined,
    });
    
    setIsLoading(false);

    if (result.success) {
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    } else {
      console.log('AddToCart error result:', result); // Debug
      const errorMsg = result.message || 'Có lỗi xảy ra';
      console.log('Error message to display:', errorMsg); // Debug
      setError(errorMsg);
      setTimeout(() => setError(''), 5000);
    }
  };

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const inCart = isInCart(product.id);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Size Selector (if applicable) */}
      {product.category === 'fashion' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Kích thước
          </label>
          <div className="flex gap-2">
            {['S', 'M', 'L', 'XL', 'XXL'].map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-3 py-2 border rounded-md text-sm font-medium transition-colors ${
                  selectedSize === size
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color Selector (if applicable) */}
      {product.category === 'fashion' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Màu sắc
          </label>
          <div className="flex gap-2">
            {['Đen', 'Trắng', 'Xanh', 'Đỏ', 'Xám'].map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`px-3 py-2 border rounded-md text-sm font-medium transition-colors ${
                  selectedColor === color
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity Selector */}
      {showQuantitySelector && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Số lượng
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={decrementQuantity}
              disabled={quantity <= 1}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-12 text-center font-medium text-gray-900 dark:text-white">
              {quantity}
            </span>
            <button
              onClick={incrementQuantity}
              disabled={quantity >= product.stock}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
              ({product.stock} có sẵn)
            </span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={product.stock <= 0 || isLoading}
        className={`${buttonText ? 'w-full' : 'p-2'} flex items-center justify-center gap-2 ${buttonText ? 'px-6 py-3' : ''} rounded-lg font-medium transition-all ${
          product.stock <= 0 || isLoading
            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            : isAdded
            ? 'bg-green-600 text-white'
            : inCart
            ? 'bg-orange-600 hover:bg-orange-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        } ${className}`}
      >
        {product.stock <= 0 ? (
          buttonText ? 'Hết hàng' : <ShoppingCart className="w-4 h-4" />
        ) : isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {buttonText && 'Đang thêm...'}
          </>
        ) : isAdded ? (
          <>
            <Check className={buttonText ? "w-5 h-5" : "w-4 h-4"} />
            {buttonText && 'Đã thêm vào giỏ!'}
          </>
        ) : inCart ? (
          <>
            <ShoppingCart className={buttonText ? "w-5 h-5" : "w-4 h-4 group-hover:scale-110 transition-transform"} />
            {buttonText && 'Thêm thêm vào giỏ'}
          </>
        ) : (
          <>
            <ShoppingCart className={buttonText ? "w-5 h-5" : "w-4 h-4 group-hover:scale-110 transition-transform"} />
            {buttonText && buttonText}
          </>
        )}
      </button>

      {inCart && (
        <p className="text-sm text-green-600 dark:text-green-400 text-center">
          ✓ Sản phẩm đã có trong giỏ hàng
        </p>
      )}
    </div>
  );
}
