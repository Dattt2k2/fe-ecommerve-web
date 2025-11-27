'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProductCard from '@/components/product/ProductCard';
import { useState } from 'react';
import { useBestSeller } from '@/hooks/useApi';
import SmoothLink from '@/components/ui/SmoothLink';

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  

  useEffect(() => {
    if (loading) return;

    if (isAuthenticated && user) {
      const userRole = user.role?.toLowerCase();
      if (userRole === 'admin' || userRole === 'seller') {
        router.replace('/seller');
        return;
      }
    }
  }, [user, loading, isAuthenticated, router]);


  const { data: bestSellerResponse, loading: bestSellerLoading } = useBestSeller();

  const featured = useMemo(() => {
    if (!bestSellerResponse) return [];
    
    const rawProducts = bestSellerResponse.products || [];
    
    return rawProducts.map((item: any) => {
      const getValidImageUrl = (imagePath: any): string => {
        if (!imagePath) return '/images/placeholder.jpg';
        
        if (Array.isArray(imagePath)) {
          const validUrl = imagePath.find((url: any) => {
            if (typeof url !== 'string' || !url) return false;
            return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
          });
          return validUrl || '/images/placeholder.jpg';
        }
        
        if (typeof imagePath === 'string' && imagePath) {
          if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('/')) {
            return imagePath;
          }
        }
        
        return '/images/placeholder.jpg';
      };
      
      return {
        ...item,
        image: getValidImageUrl(item.image_path || item.image),
        images: Array.isArray(item.image_path) 
          ? item.image_path.filter((url: any) => typeof url === 'string' && url)
          : [],
      };
    });
  }, [bestSellerResponse]);


  if (!loading && isAuthenticated && user) {
    const userRole = user.role?.toLowerCase();
    if (userRole === 'admin' || userRole === 'seller') {
      return null;
    }
  }

  if (bestSellerLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }


  return (
    <div>
      <section className="py-8 sm:py-12 lg:py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Sản phẩm bán chạy
            </h2>
            {featured.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">Không có sản phẩm nào</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                  {featured.map((p: import('@/types').Product) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
                <div className="text-center mt-6 flex justify-center">
                  <SmoothLink href="/products" className="inline-block px-6 py-3 bg-orange-500 text-white font-medium rounded-full hover:bg-orange-600 transition-colors">
                    Xem tất cả sản phẩm
                  </SmoothLink>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
