'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/types';
import { getAllProducts } from '@/lib/data';
import ProductCard from './ProductCard';

interface RelatedProductsProps {
  currentProduct: Product;
  limit?: number;
}

export default function RelatedProducts({ currentProduct, limit = 4 }: RelatedProductsProps) {
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        const allProducts = await getAllProducts();
        
        // Filter products: same category, exclude current product
        const related = allProducts
          .filter(product => 
            product.category === currentProduct.category && 
            product.id !== currentProduct.id
          )
          .slice(0, limit);

        // If not enough products in same category, add random products
        if (related.length < limit) {
          const remaining = allProducts
            .filter(product => 
              product.category !== currentProduct.category && 
              product.id !== currentProduct.id
            )
            .slice(0, limit - related.length);
          
          related.push(...remaining);
        }

        setRelatedProducts(related);
      } catch (error) {
        console.error('Error fetching related products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [currentProduct, limit]);

  if (loading) {
    return (
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Sản phẩm liên quan
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 aspect-square rounded-lg mb-4"></div>
              <div className="space-y-2">
                <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded"></div>
                <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded w-3/4"></div>
                <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Sản phẩm liên quan
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {relatedProducts.map((product) => (
          <ProductCard key={product.id} product={product} viewMode="grid" />
        ))}
      </div>
    </div>
  );
}
