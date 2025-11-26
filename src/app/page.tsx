'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProductCard from '@/components/product/ProductCard';
import { useState } from 'react';
import { useProducts } from '@/hooks/useApi';

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(10);
  const [totalProducts, setTotalProducts] = useState(0);
  
  useEffect(() => {
    const calculateProductsPerPage = () => {
      const width = window.innerWidth;
      let cols = 1; // Mobile default
      
      if (width >= 1280) { // xl
        cols = 5;
      } else if (width >= 1024) { // lg
        cols = 4;
      } else if (width >= 768) { // md
        cols = 3;
      } else if (width >= 640) { // sm
        cols = 2;
      }
      
      // 2 hàng x số cột
      setProductsPerPage(cols * 2);
    };
    
    // Tính toán lần đầu
    calculateProductsPerPage();
    
    window.addEventListener('resize', calculateProductsPerPage);
    
    return () => {
      window.removeEventListener('resize', calculateProductsPerPage);
    };
  }, []);

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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [productsPerPage]);

  const apiParams = useMemo(() => ({
    page: currentPage,
    limit: productsPerPage
  }), [currentPage, productsPerPage]);

  const { data: productsResponse, loading: productsLoading } = useProducts(apiParams);

  const featured = useMemo(() => {
    if (!productsResponse) return [];
    
    const rawProducts = productsResponse.products || [];
    
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
  }, [productsResponse]);

  useEffect(() => {
    if (productsResponse?.pagination) {
      setTotalProducts(productsResponse.pagination.total || 0);
    }
  }, [productsResponse]);

  if (!loading && isAuthenticated && user) {
    const userRole = user.role?.toLowerCase();
    if (userRole === 'admin' || userRole === 'seller') {
      return null;
    }
  }

  if (productsLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  const totalPages = productsResponse?.pagination?.pages || Math.ceil(totalProducts / productsPerPage) || 1;

  return (
    <div>
      <section className="py-8 sm:py-12 lg:py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Sản phẩm nổi bật
            </h2>
            {featured.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">Không có sản phẩm nào</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                  {featured.map((p: import('@/types').Product) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-4">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Trước
                    </button>
                    
                    <div className="flex items-center gap-2">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                              currentPage === pageNum
                                ? 'bg-blue-600 dark:bg-blue-700 text-white'
                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Sau
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
