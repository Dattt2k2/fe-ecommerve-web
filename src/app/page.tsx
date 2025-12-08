'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProductCard from '@/components/product/ProductCard';
import { useProducts, useCategoryList, useAdvancedSearch } from '@/hooks/useApi';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // States
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(12);
  const [categoryScrollPosition, setCategoryScrollPosition] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Get search query from URL params
  const activeSearchQuery = searchParams.get('search') || '';

  // Fetch categories
  const { data: categoriesData } = useCategoryList();
  const categories = Array.isArray(categoriesData)
    ? categoriesData.map((cat: any) =>
        typeof cat === 'string' ? { id: cat, name: cat } : { id: cat.id, name: cat.name }
      )
    : [];

  // Update scroll buttons visibility
  const updateScrollButtons = () => {
    if (!categoryScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10); // 10px threshold
  };

  // Category scroll functions
  const scrollCategories = (direction: 'left' | 'right') => {
    if (!categoryScrollRef.current) return;
    const scrollAmount = 200;
    const currentScroll = categoryScrollRef.current.scrollLeft;
    const newPosition = direction === 'right' 
      ? currentScroll + scrollAmount
      : currentScroll - scrollAmount;
    
    categoryScrollRef.current.scrollTo({
      left: newPosition,
      behavior: 'smooth'
    });
  };

  // Update scroll buttons on mount and when categories change
  useEffect(() => {
    updateScrollButtons();
    const handleResize = () => updateScrollButtons();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [categories]);


  // Build API params for products - always sort by bestseller
  const apiParams = useMemo(() => {
    const params: any = {
      page: currentPage,
      limit: productsPerPage,
      sortBy: 'sold_count',
      sortOrder: 'desc',
    };

    // Add search query if active
    if (activeSearchQuery) {
      params.search = activeSearchQuery;
    }

    return params;
  }, [currentPage, productsPerPage, activeSearchQuery]);

  // Determine if we should use advanced search
  const shouldUseSearchAdvanced = useMemo(() => {
    const result = activeSearchQuery.trim().length > 0;
    console.log('[Home] shouldUseSearchAdvanced:', result, 'activeSearchQuery:', activeSearchQuery);
    return result;
  }, [activeSearchQuery]);

  // Prepare params for each API
  const regularParams = useMemo(() => {
    return !shouldUseSearchAdvanced ? { ...apiParams, _useSearch: false } : null;
  }, [shouldUseSearchAdvanced, apiParams]);

  const advancedSearchParams = useMemo(() => {
    return shouldUseSearchAdvanced ? { ...apiParams, _useSearch: true } : null;
  }, [shouldUseSearchAdvanced, apiParams]);

  // Fetch products - use advanced search if needed
  const { data: regularResponse, loading: regularLoading } = useProducts(regularParams);
  const { data: searchResponse, loading: searchLoading } = useAdvancedSearch(advancedSearchParams);

  const productsResponse = shouldUseSearchAdvanced ? searchResponse : regularResponse;
  const productsLoading = shouldUseSearchAdvanced ? searchLoading : regularLoading;

  // Debug logging
  useEffect(() => {
    console.log('[Home] Products response:', productsResponse);
    console.log('[Home] Products loading:', productsLoading);
    console.log('[Home] Active search query:', activeSearchQuery);
  }, [productsResponse, productsLoading, activeSearchQuery]);

  // Process products
  const products = useMemo(() => {
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


  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeSearchQuery]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  if (loading) {
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Categories Section - Horizontal scrollable */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                DANH MỤC
              </h2>
            </div>
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              {/* Left Arrow */}
              {canScrollLeft && (
                <button
                  onClick={() => scrollCategories('left')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              )}
              
              {/* Scrollable Categories */}
              <div
                ref={categoryScrollRef}
                className="flex gap-3 overflow-x-auto scroll-smooth hide-scrollbar"
                style={{ 
                  scrollbarWidth: 'none', 
                  msOverflowStyle: 'none'
                }}
                onScroll={(e) => {
                  setCategoryScrollPosition(e.currentTarget.scrollLeft);
                  updateScrollButtons();
                }}
              >
                {/* All Categories Button */}
                <button
                  onClick={() => router.push('/products')}
                  className="flex-shrink-0 px-4 py-2 rounded-lg transition-all bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-transparent whitespace-nowrap"
                >
                  <span className="text-sm text-center text-gray-700 dark:text-gray-300 font-medium">
                    Tất cả
                  </span>
                </button>
                
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      const categoryName = encodeURIComponent(category.name);
                      router.push(`/products?category=${categoryName}`);
                    }}
                    className="flex-shrink-0 px-4 py-2 rounded-lg transition-all bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-transparent whitespace-nowrap"
                  >
                    <span className="text-sm text-center text-gray-700 dark:text-gray-300 font-medium">
                      {category.name}
                    </span>
                  </button>
                ))}
              </div>
              
              {/* Right Arrow */}
              {canScrollRight && (
                <button
                  onClick={() => scrollCategories('right')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Products Section */}
          <div>
            {/* Products Grid */}
            {productsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Đang tải sản phẩm...</p>
                </div>
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-600 dark:text-gray-400">Không tìm thấy sản phẩm nào</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {products.map((product: import('@/types').Product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {productsResponse?.pagination && productsResponse.pagination.pages > 1 && (
                  <div className="mt-8 flex justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-100 dark:hover:bg-orange-900 transition-colors"
                    >
                      Trước
                    </button>
                    {Array.from({ length: Math.min(5, productsResponse.pagination.pages) }, (_, i) => {
                      let pageNum;
                      if (productsResponse.pagination.pages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= productsResponse.pagination.pages - 2) {
                        pageNum = productsResponse.pagination.pages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            currentPage === pageNum
                              ? 'bg-orange-500 text-white'
                              : 'border border-gray-300 dark:border-gray-600 hover:bg-orange-100 dark:hover:bg-orange-900'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(productsResponse.pagination.pages, prev + 1))}
                      disabled={currentPage === productsResponse.pagination.pages}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-100 dark:hover:bg-orange-900 transition-colors"
                    >
                      Sau
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
