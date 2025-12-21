'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/product/ProductCard';
import { Product } from '@/types';
import { Filter, Grid, List, Search } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useProducts, useCategoryList, useAdvancedSearch, useProductsByCategory } from '@/hooks/useApi';

export default function ProductsPage() {
  const { showError } = useToast();
  const urlSearchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('name');
  const [filterBy, setFilterBy] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState([0, 60000000]);
  const [priceInputMin, setPriceInputMin] = useState('');
  const [priceInputMax, setPriceInputMax] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(9);
  const [totalProducts, setTotalProducts] = useState(0);

  // Fetch categories
  const { data: categoriesData, loading: categoriesLoading } = useCategoryList();
  const categories = Array.isArray(categoriesData)
  ? categoriesData.map((cat: any) =>
      typeof cat === 'string' ? { id: cat, name: cat } : { id: cat.id, name: cat.name }
    )
  : [];

  // Get category name from URL params
  const categoryNameFromUrl = useMemo(() => {
    const categoryParam = urlSearchParams.get('category');
    return categoryParam ? decodeURIComponent(categoryParam) : null;
  }, [urlSearchParams]);

  // Read category from URL params and set filterBy
  useEffect(() => {
    if (categoryNameFromUrl) {
      // Find category by name
      const foundCategory = categories.find(
        (cat) => cat.name.toLowerCase() === categoryNameFromUrl.toLowerCase()
      );
      if (foundCategory) {
        setFilterBy(String(foundCategory.id));
      }
    } else {
      setFilterBy('all');
    }
  }, [categoryNameFromUrl, categories]);

  // Calculate products per page based on screen size
  useEffect(() => {
    const calculateProductsPerPage = () => {
      const width = window.innerWidth;
      let cols = 1;
      
      if (width >= 1536) { // 2xl
        cols = 5;
      } else if (width >= 1280) { // xl
        cols = 4;
      } else if (width >= 1024) { // lg
        cols = 3;
      } else if (width >= 768) { // md
        cols = 2;
      } else if (width >= 640) { // sm
        cols = 2;
      }

      setProductsPerPage(cols * 3);
    };

    calculateProductsPerPage();
    window.addEventListener('resize', calculateProductsPerPage);
    return () => {
      window.removeEventListener('resize', calculateProductsPerPage);
    };
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterBy, searchQuery, priceRange, sortBy]);

  // Sync input state with priceRange when it changes externally
  useEffect(() => {
    setPriceInputMin(priceRange[0] > 0 ? formatPrice(priceRange[0]) : '');
    setPriceInputMax(priceRange[1] < 60000000 ? formatPrice(priceRange[1]) : '');
  }, [priceRange]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Build API params with filters and pagination
  const apiParams = useMemo(() => {
    const params: any = {
      page: currentPage,
      limit: productsPerPage,
    };

    // Add search query
    if (searchQuery) {
      params.search = searchQuery;
    }

    if (filterBy !== 'all') {
      // Find category name from categories list
      const selectedCategory = categories.find(
        (cat) => String(cat.id) === String(filterBy)
      );
      if (selectedCategory) {
        params.category = selectedCategory.name;
      }
    }

    // Add price range
    if (priceRange[0] > 0) {
      params.minPrice = priceRange[0];
    }
    if (priceRange[1] < 60000000) {
      params.maxPrice = priceRange[1];
    }

    // Add sorting
    if (sortBy === 'price-low') {
      params.sortBy = 'price';
      params.sortOrder = 'asc';
    } else if (sortBy === 'price-high') {
      params.sortBy = 'price';
      params.sortOrder = 'desc';
    } else if (sortBy === 'rating') {
      params.sortBy = 'rating';
      params.sortOrder = 'desc';
    } else if (sortBy === 'reviews') {
      params.sortBy = 'reviews';
      params.sortOrder = 'desc';
    } else {
      params.sortBy = 'name';
      params.sortOrder = 'asc';
    }

    return params;
  }, [currentPage, productsPerPage, searchQuery, filterBy, priceRange, sortBy, categories]);

  const hasSearch = searchQuery.trim().length > 0;
  const hasCategoryFilter = filterBy !== 'all' || !!categoryNameFromUrl;
  const hasSort = sortBy !== 'name';
  const hasPriceFilter = priceRange[0] > 0 || priceRange[1] < 60000000;
  
  const selectedCategory = useMemo(() => {
    if (filterBy !== 'all') {
      return categories.find((cat) => String(cat.id) === String(filterBy));
    }
    if (categoryNameFromUrl && categories.length > 0) {
      return categories.find((cat) => cat.name.toLowerCase() === categoryNameFromUrl.toLowerCase());
    }
    return null;
  }, [filterBy, categories, categoryNameFromUrl]);

  // Use products by category when ONLY category filter is applied (no search, sort, price)
  // Only use category API if we have a valid category name
  const shouldUseCategoryAPI = hasCategoryFilter && !hasSearch && !hasSort && !hasPriceFilter && !!selectedCategory?.name;
  
  // Use advanced search when there's search, sort, or price filter
  const shouldUseSearchAdvanced = hasSearch || hasSort || hasPriceFilter;

  // Debug log
  useEffect(() => {
    console.log('[ProductsPage] API selection:', {
      hasCategoryFilter,
      hasSearch,
      hasSort,
      hasPriceFilter,
      shouldUseCategoryAPI,
      shouldUseSearchAdvanced,
      selectedCategory: selectedCategory?.name
    });
  }, [hasCategoryFilter, hasSearch, hasSort, hasPriceFilter, shouldUseCategoryAPI, shouldUseSearchAdvanced, selectedCategory]);

  // Build params for category API (without category in params since it's in the endpoint)
  const categoryParams = useMemo(() => {
    if (!shouldUseCategoryAPI) return null;
    const params: any = {
      page: currentPage,
      limit: productsPerPage,
    };

    // Add sorting
    if (sortBy === 'price-low' as string) {
      params.sortBy = 'price';
      params.sortOrder = 'asc';
    } else if (sortBy === 'price-high' as string) {
      params.sortBy = 'price';
      params.sortOrder = 'desc';
    } else if (sortBy === 'rating' as string) {
      params.sortBy = 'rating';
      params.sortOrder = 'desc';
    } else if (sortBy === 'reviews' as string) {
      params.sortBy = 'reviews';
      params.sortOrder = 'desc';
    } else {
      params.sortBy = 'name';
      params.sortOrder = 'asc';
    }
    
    return params;
  }, [shouldUseCategoryAPI, currentPage, productsPerPage, sortBy]);

  const regularParams = useMemo(() => {
    // Don't use regular API if we have category filter (use category API instead)
    if (hasCategoryFilter) {
      return null;
    }
    // Don't use regular API if we should use advanced search
    if (shouldUseSearchAdvanced) {
      return null;
    }
    // Remove category from params if it exists (shouldn't happen, but just in case)
    const { category, ...paramsWithoutCategory } = apiParams;
    return { ...paramsWithoutCategory, _useSearch: false };
  }, [hasCategoryFilter, shouldUseSearchAdvanced, apiParams]);
  
  const searchParams = useMemo(() => {
    return shouldUseSearchAdvanced ? { ...apiParams, _useSearch: true } : null;
  }, [shouldUseSearchAdvanced, apiParams]);

  // Use appropriate API based on filters
  const { data: regularResponse, loading: regularLoading } = useProducts(regularParams);
  const { data: searchResponse, loading: searchLoading } = useAdvancedSearch(searchParams);
  const { data: categoryResponse, loading: categoryLoading } = useProductsByCategory(
    shouldUseCategoryAPI ? selectedCategory?.name || null : null,
    categoryParams
  );

  // Determine which response to use
  const productsResponse = shouldUseCategoryAPI 
    ? categoryResponse 
    : (shouldUseSearchAdvanced ? searchResponse : regularResponse);
  
  // Track if we've ever received a response (to distinguish between "loading" and "no products")
  const [hasReceivedResponse, setHasReceivedResponse] = useState(false);
  
  // Reset hasReceivedResponse when filters change
  useEffect(() => {
    setHasReceivedResponse(false);
  }, [shouldUseCategoryAPI, shouldUseSearchAdvanced, selectedCategory?.name, searchQuery, filterBy, priceRange, sortBy, currentPage]);
  
  useEffect(() => {
    if (productsResponse !== undefined && productsResponse !== null) {
      setHasReceivedResponse(true);
    }
  }, [productsResponse]);

  // Only show loading for the API that's actually being used
  // Show loading if currently loading OR if we haven't received any response yet
  // Also show loading if categories are loading and we need category for API selection
  const productsLoading = useMemo(() => {
    // If categories are loading and we have category in URL, show loading
    if (categoriesLoading && categoryNameFromUrl) {
      return true;
    }
    
    if (shouldUseCategoryAPI) {
      return categoryLoading || (!hasReceivedResponse && categoryResponse === undefined);
    }
    if (shouldUseSearchAdvanced) {
      return searchLoading || (!hasReceivedResponse && searchResponse === undefined);
    }
    return regularLoading || (!hasReceivedResponse && regularResponse === undefined);
  }, [shouldUseCategoryAPI, shouldUseSearchAdvanced, categoryLoading, categoryResponse, searchLoading, searchResponse, regularLoading, regularResponse, hasReceivedResponse, categoriesLoading, categoryNameFromUrl]);

  // Map products data
  const products = useMemo(() => {
    if (!productsResponse) {
      console.log('[ProductsPage] No productsResponse');
      return [];
    }
    
    const rawProducts = productsResponse.products || [];
    console.log('[ProductsPage] Raw products:', rawProducts);
    
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
      
      // Compute price and stock from variants if available
      let price = item.price || 0;
      let stock = item.stock || item.quantity || 0;
      
      if (item.variants && Array.isArray(item.variants) && item.variants.length > 0) {
        price = Math.min(...item.variants.map((v: any) => v.price || 0));
        stock = item.variants.reduce((sum: number, v: any) => sum + (v.quantity || 0), 0);
      }
      
      const mappedProduct = {
        ...item,
        price: price,
        stock: stock,
        image: getValidImageUrl(item.image_path || item.image),
        images: Array.isArray(item.image_path) 
          ? item.image_path.filter((url: any) => typeof url === 'string' && url)
          : [],
      };
      
      console.log('[ProductsPage] Mapped product:', mappedProduct.id, 'image:', mappedProduct.image);
      return mappedProduct;
    });
  }, [productsResponse]);

  // Update total products from pagination
  useEffect(() => {
    if (productsResponse?.pagination) {
      setTotalProducts(productsResponse.pagination.total || 0);
    }
  }, [productsResponse]);

  const totalPages = useMemo(() => {
    // Use pages from API if available
    if (productsResponse?.pagination?.pages) {
      return productsResponse.pagination.pages;
    }
    
    // Otherwise calculate from total
    const total = productsResponse?.pagination?.total || totalProducts || 0;
    if (total === 0) return 1;
    
    if (productsPerPage > 0) {
      return Math.ceil(total / productsPerPage);
    }
    return 1;
  }, [productsResponse?.pagination, productsPerPage, totalProducts]);

  // Helper function to format number with dots
  const formatPrice = (price: number): string => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Helper function to parse formatted price
  const parsePrice = (formattedPrice: string): number => {
    return parseInt(formattedPrice.replace(/\./g, '')) || 0;
  };

  // Helper function to format input while typing
  const formatInputPrice = (value: string): string => {
    // Remove all non-digit characters
    const digitsOnly = value.replace(/\D/g, '');
    if (!digitsOnly) return '';
    // Format with dots
    return formatPrice(parseInt(digitsOnly));
  };

  if (productsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-1/4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
                {/* Search */}
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tìm kiếm
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Tìm sản phẩm..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div> */}

                {/* Price Range */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Khoảng giá
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Từ"
                        value={priceInputMin}
                        onChange={(e) => {
                          const formatted = formatInputPrice(e.target.value);
                          setPriceInputMin(formatted);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const parsed = parsePrice(e.currentTarget.value);
                            setPriceRange([parsed, priceRange[1]]);
                            e.currentTarget.blur();
                          }
                        }}
                        onBlur={(e) => {
                          const parsed = parsePrice(e.target.value);
                          setPriceRange([parsed, priceRange[1]]);
                          if (parsed > 0) {
                            setPriceInputMin(formatPrice(parsed));
                          } else {
                            setPriceInputMin('');
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 w-full"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="text"
                        placeholder="Đến"
                        value={priceInputMax}
                        onChange={(e) => {
                          const formatted = formatInputPrice(e.target.value);
                          setPriceInputMax(formatted);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const parsed = parsePrice(e.currentTarget.value);
                            setPriceRange([priceRange[0], parsed || 60000000]);
                            e.currentTarget.blur();
                          }
                        }}
                        onBlur={(e) => {
                          const parsed = parsePrice(e.target.value);
                          const finalValue = parsed || 60000000;
                          setPriceRange([priceRange[0], finalValue]);
                          if (finalValue < 60000000) {
                            setPriceInputMax(formatPrice(finalValue));
                          } else {
                            setPriceInputMax('');
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 w-full"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'Dưới 1 triệu', range: [0, 1000000] },
                        { label: '1-5 triệu', range: [1000000, 5000000] },
                        { label: '5-20 triệu', range: [5000000, 20000000] },
                        { label: 'Trên 20 triệu', range: [20000000, 60000000] }
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          onClick={() => {
                            setPriceRange(preset.range);
                            setPriceInputMin(preset.range[0] > 0 ? formatPrice(preset.range[0]) : '');
                            setPriceInputMax(preset.range[1] < 60000000 ? formatPrice(preset.range[1]) : '');
                          }}
                          className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                <button className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-orange-500 text-gray-900 dark:text-gray-100 ml-auto" onClick={() => {
                  setPriceRange([0, 60000000]);
                  setPriceInputMin('');
                  setPriceInputMax('');
                }}>
                  Xóa bộ lọc
                </button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:w-3/4">
              {/* Toolbar */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Hiển thị {products.length} / {totalProducts} sản phẩm
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Sort */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="name">Tên A-Z</option>
                      <option value="price-low">Giá thấp → cao</option>
                      <option value="price-high">Giá cao → thấp</option>
                      <option value="rating">Đánh giá cao nhất</option>
                      <option value="reviews">Nhiều đánh giá nhất</option>
                    </select>

                    {/* View Mode */}
                    <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 ${
                          viewMode === 'grid'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        <Grid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 ${
                          viewMode === 'list'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Products Grid/List */}
              {productsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Đang tải sản phẩm...</p>
                </div>
              ) : products.length > 0 ? (
                <>
                  <div className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6'
                      : 'space-y-4'
                  }>
                    {products.map((product) => (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        viewMode={viewMode}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (productsResponse?.pagination?.has_next || currentPage < totalPages) && (
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
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 dark:text-gray-600 mb-4">
                    <Filter className="w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Không tìm thấy sản phẩm
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm
                  </p>
                  <button
                    onClick={() => {
                      setFilterBy('all');
                      setSearchQuery('');
                      setPriceRange([0, 60000000]);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
