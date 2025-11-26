'use client';

import Image from 'next/image';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Star, ShoppingCart, Heart, Eye } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import SmoothLink from '@/components/ui/SmoothLink';

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
}

export default function ProductCard({ product, viewMode = 'grid' }: ProductCardProps) {
  const { addToCart } = useCart();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock > 0) {
      await addToCart(product);
    }
  };
  if (viewMode === 'list') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        <div className="flex flex-col sm:flex-row">
          <SmoothLink href={`/products/${product.id}`} className="sm:w-48 h-48 sm:h-auto">
            <div className="relative w-full h-full bg-gray-200 dark:bg-gray-700">
              {product.image && (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover hover:scale-105 transition-transform"
                />
              )}
              {!product.image && (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  Không có ảnh
                </div>
              )}
            </div>
          </SmoothLink>
          
          <div className="flex-1 p-6">
            <div className="flex flex-col h-full">
              <SmoothLink href={`/products/${product.id}`}>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2 mb-2">
                  {product.name}
                </h3>
              </SmoothLink>
              
              <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
                {product.description}
              </p>
              
              <div className="flex items-center mb-3">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < product.rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                  ({product.reviews} đánh giá)
                </span>
              </div>
              
              {product.tags && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {product.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-between mt-auto">
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-500">
                    Còn {product.stock} sản phẩm
                  </span>
                </div>
                
                {/* <button 
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className={`${
                    product.stock <= 0 
                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl'
                  } px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 font-medium`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {product.stock <= 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
                </button> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group h-full flex flex-col justify-between">
      <SmoothLink href={`/products/${product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-gray-200 dark:bg-gray-700">
          {product.image && (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )}
          {!product.image && (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              Không có ảnh
            </div>
          )}
          
          {/* Stock indicator
          {product.stock < 10 && (
            <div className="absolute bottom-2 left-2 bg-orange-500 text-white px-2 py-1 text-xs rounded">
              Chỉ còn {product.stock}
            </div>
          )} */}
        </div>
      </SmoothLink>
      
      <div className="p-4">
        <SmoothLink href={`/products/${product.id}`}>
          <h3 className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2 mb-2 min-h-[3rem]">
            {product.name}
          </h3>
        </SmoothLink>
        
        {/* <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
          {product.description}
        </p> */}
        
        <div className="flex items-center mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < product.rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">({product.rating})</span>
        </div>
        
        {product.tags && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
          <div className="flex items-center justify-between gap-3">
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatPrice(product.price)}
          </span>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">(Đã bán {product.sold_count})</span>
          </div>
          
        </div>
      </div>
    </div>
  );
}
