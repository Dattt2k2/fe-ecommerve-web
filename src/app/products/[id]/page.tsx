'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, ShoppingCart, Heart, Share2, Star, Truck, Shield, RotateCcw } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Product } from '@/types';
import { apiClient } from '@/lib/api';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState('1');
  const [selectedVariant, setSelectedVariant] = useState<{ size: string; color: string; material: string } | null>(null);
  const [reviews, setReviews] = useState<{ rating: number; title: string; body_review: string; created_at: string }[]>([]);
  const [newReview, setNewReview] = useState({ rating: 0, body_review: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 3;
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const reviewsFetchedRef = useRef<string | null>(null);
  // Scroll to reviews section when hash is present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash === '#reviews') {
        // Small delay to ensure page is rendered
        setTimeout(() => {
          const reviewsElement = document.getElementById('reviews');
          if (reviewsElement) {
            reviewsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    }
  }, [product]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!params.id) return;

      try {
        setLoading(true);
        console.log('Fetching product:', params.id);
        
        // Gọi API thông qua proxy của Next.js
        const response = await fetch(`/api/proxy/products/${params.id}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch product: ${response.status}`);
        }

        const data = await response.json();
        console.log('Product data received:', data);
        
        // Compute price and stock from variants if available
        let price = data.price || 0;
        let stock = data.stock || 0;
        
        if (data.variants && Array.isArray(data.variants) && data.variants.length > 0) {
          price = Math.min(...data.variants.map((v: any) => v.price || 0));
          stock = data.variants.reduce((sum: number, v: any) => sum + (v.quantity || 0), 0);
        }
        
        // Map dữ liệu từ API về Product interface
        const mappedProduct: Product = {
          id: data.id,
          name: data.name || 'Unnamed Product',
          description: data.description || '',
          price: price,
          originalPrice: data.originalPrice || data.old_price,
          category: data.category || 'Uncategorized',
          brand: data.brand || '',
          image: getValidImageUrl(data.image || data.images),
          images: Array.isArray(data.images) ? data.images : (data.image ? [data.image] : []),
          stock: stock,
          rating: data.rating || 0,
          reviews: data.count || 0,
          sold_count: data.sold || 0,
          tags: data.tags || [],
          featured: data.featured || false,
          isActive: data.isActive !== false,
          specifications: data.specifications || {},
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          variants: data.variants || [],
        };

        setProduct(mappedProduct);
        
        // Auto-select first variant if available
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant({
            size: data.variants[0].size,
            color: data.variants[0].color,
            material: data.variants[0].material
          });
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        showError('Không thể tải thông tin sản phẩm');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.id, showError]);

  useEffect(() => {
    // Reset ref when product ID changes
    if (product?.id && reviewsFetchedRef.current !== product.id) {
      // If product ID changed, reset the ref
      if (reviewsFetchedRef.current && reviewsFetchedRef.current !== product.id) {
        reviewsFetchedRef.current = null;
      }
    }

    // Only fetch reviews if product is loaded and we haven't fetched for this product ID yet
    if (!product || !product.id) {
      return;
    }

    // Check if we've already fetched reviews for this product ID
    if (reviewsFetchedRef.current === product.id) {
      return;
    }

    const fetchReviews = async () => {
      try {
        const response = await fetch(`/api/proxy/products/${params.id}/reviews`);
        if (!response.ok) {
          throw new Error('Failed to fetch reviews');
        }
        const data = await response.json();
        console.log('Fetched reviews:', data);
        console.log('Review count from API:', data.count);

        // Mark as fetched for this product ID
        reviewsFetchedRef.current = product.id;

        // Ensure the reviews are properly set
        setReviews(data.reviews || []);

        // Update the product rating and review count dynamically based on reviews
        if (data.count !== undefined) {
          // Always update review count from API response
          setProduct((prev) => {
            if (!prev) {
              console.warn('Cannot update reviews: product not yet loaded');
              return prev;
            }
            const updated = { 
              ...prev, 
              reviews: data.count || 0 
            };
            console.log('Updating product reviews count to:', updated.reviews, 'from count:', data.count);
            return updated;
          });
        } else {
          console.warn('Review count not found in API response');
        }

        // Update rating if there are reviews
        if (data.reviews && data.reviews.length > 0) {
          const totalRating = data.reviews.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0);
          const averageRating = totalRating / data.reviews.length;
          setProduct((prev) => prev ? { 
            ...prev, 
            rating: averageRating
          } : prev);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };

    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, product?.id]); // Only depend on params.id and product.id, not entire product object

  // Helper function to validate image URLs
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

  const handleAddToCart = async () => {

    if (!isAuthenticated || !user) {
      showError('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      router.push('/auth/login');
      return;
    }

    if (user.role === 'admin' || user.role === 'seller') {
      showError('Bạn không có quyền thêm sản phẩm vào giỏ hàng');
      return;
    }

    if (!product) return;
    
    // Validate variant selection if product has variants
    if (product.variants && product.variants.length > 0) {
      if (!selectedVariant) {
        showError('Vui lòng chọn size và màu sắc');
        return;
      }
      
      // Check if selected variant exists and has stock
      const currentVariant = product.variants.find(v => 
        v.size === selectedVariant.size && 
        v.color === selectedVariant.color
      );
      
      if (!currentVariant) {
        showError('Loại sản phẩm đã chọn không tồn tại');
        return;
      }
      
      if (currentVariant.quantity < quantity) {
        showError(`Chỉ còn ${currentVariant.quantity} sản phẩm trong kho`);
        return;
      }
    }
    
    // Get variant_id if available
    const variantId = product.variants && selectedVariant
      ? product.variants.find(v => 
          v.size === selectedVariant.size && 
          v.color === selectedVariant.color
        )?.id
      : undefined;
    
    const result = await addToCart(product, quantity, {
      variant_id: variantId,
    });
    
    if (result.success) {
      showSuccess(`Đã thêm ${quantity} sản phẩm vào giỏ hàng`);
    } else {
      showError(result.message || 'Không thể thêm sản phẩm vào giỏ hàng');
    }
  };

  const handleBuyNow = () => {

    if (!isAuthenticated || !user) {
      showError('Vui lòng đăng nhập để mua sản phẩm');
      router.push('/auth/login');
      return;
    }

    if (user.role === 'admin' || user.role === 'seller') {
      showError('Bạn không có quyền mua sản phẩm');
      return;
    }

    if (!product) return;

    // Validate variant selection if product has variants
    if (product.variants && product.variants.length > 0) {
      if (!selectedVariant) {
        showError('Vui lòng chọn size và màu sắc');
        return;
      }
      
      // Check if selected variant exists and has stock
      const currentVariant = product.variants.find(v => 
        v.size === selectedVariant.size && 
        v.color === selectedVariant.color
      );
      
      if (!currentVariant) {
        showError('Loại sản phẩm đã chọn không tồn tại');
        return;
      }
      
      if (currentVariant.quantity < quantity) {
        showError(`Chỉ còn ${currentVariant.quantity} sản phẩm trong kho`);
        return;
      }
    }

    // Get variant_id if available
    const variantId = product.variants && selectedVariant
      ? product.variants.find(v => 
          v.size === selectedVariant.size && 
          v.color === selectedVariant.color
        )?.id
      : undefined;

    // Chuyển hướng đến trang order với thông tin sản phẩm
    const params = new URLSearchParams({
      productId: product.id,
      quantity: quantity.toString(),
    });
    
    if (variantId) {
      params.append('variant_id', variantId);
    }
    if (selectedVariant?.size) {
      params.append('size', selectedVariant.size);
    }
    if (selectedVariant?.color) {
      params.append('color', selectedVariant.color);
    }
    
    router.push(`/order?${params.toString()}`);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {

    e.preventDefault();
    if (!isAuthenticated || !user) {
      showError('Vui lòng đăng nhập để đánh giá sản phẩm');
      router.push('/auth/login');
      return;
    }

    if (user.role === 'admin' || user.role === 'seller') {
      showError('Bạn không có quyền đánh giá sản phẩm');
      return;
    }
    
    try {
      const result: any = await apiClient.post(`/api/proxy/products/create-reviews/${params.id}`, newReview);

      if (result.error) {
        if (result.error === 'user has not purchased this product') {
          alert('Bạn phải mua sản phẩm này trước khi có thể đánh giá.');
        } else {
          throw new Error(result.error || 'Failed to submit review');
        }
        return;
      }

      setReviews((prev) => [...prev, result as any]);
      setNewReview({ rating: 0, body_review: '' });
      showSuccess('Đánh giá đã được gửi thành công!');
    } catch (error) {
      console.error('Error submitting review:', error);
      showError('Có lỗi xảy ra khi gửi đánh giá.');
    }
  };

  const handleLoadMore = () => {
    setCurrentPage((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-[3rem] w-[3rem] border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Không tìm thấy sản phẩm</h1>
        <button
          onClick={() => router.push('/products')}
          className="text-blue-600 hover:underline"
        >
          Quay lại danh sách sản phẩm
        </button>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [product.image];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-[1rem] sm:px-[1.5rem] lg:px-[2rem] py-[2rem]">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                <Image
                  src={images[selectedImage]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 90vw, 50vw"
                />
              </div>

              {/* Thumbnail Images */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === index
                          ? 'border-blue-600'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.name} - ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="10rem"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Title & Rating */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {product.name}
                </h1>
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(product.rating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-gray-600 dark:text-gray-400">
                      {product.rating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-400">
                    {product.reviews} đánh giá
                  </span>
                  {product.sold_count && (
                    <span className="text-gray-600 dark:text-gray-400">
                      Đã bán {product.sold_count}
                    </span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4">
                <div className="flex items-baseline gap-4">
                  <span className="text-4xl font-bold text-red-600">
                    {(() => {
                      if (product.variants && product.variants.length > 0 && selectedVariant) {
                        const currentVariant = product.variants.find(v => 
                          v.size === selectedVariant.size && 
                          v.color === selectedVariant.color
                        );
                        return currentVariant 
                          ? currentVariant.price.toLocaleString('vi-VN')
                          : product.price.toLocaleString('vi-VN');
                      }
                      return product.price.toLocaleString('vi-VN');
                    })()}₫
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <>
                      <span className="text-xl text-gray-500 line-through">
                        {product.originalPrice.toLocaleString('vi-VN')}₫
                      </span>
                      <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm font-medium">
                        -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                      </span>
                    </>
                  )}
                  {product.variants && product.variants.length > 0 && 
                   Math.min(...product.variants.map(v => v.price)) !== Math.max(...product.variants.map(v => v.price)) && (
                    <span className="text-sm text-gray-500">
                      (Giá từ {Math.min(...product.variants.map(v => v.price)).toLocaleString('vi-VN')}₫)
                    </span>
                  )}
                </div>
              </div>

              {/* Category & Brand */}
              <div className="flex gap-4">
                {product.category && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Danh mục: </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {product.category}
                    </span>
                  </div>
                )}
                {product.brand && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Thương hiệu: </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {product.brand}
                    </span>
                  </div>
                )}
              </div>

              {/* Variants Selection */}
              {product.variants && product.variants.length > 0 && (
                <div className="space-y-4">
                  {/* Size Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Size:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(product.variants!.map(v => v.size))).map((size) => {
                        // Check if this size has any available variant (regardless of color)
                        const hasAnyVariant = product.variants!.some(v => 
                          v.size === size && v.quantity > 0
                        );
                        
                        // Check if this size is available with current color (for visual feedback)
                        const isAvailableWithCurrentColor = selectedVariant?.color
                          ? product.variants!.some(v => 
                              v.size === size && 
                              v.color === selectedVariant.color && 
                              v.quantity > 0
                            )
                          : true;
                        
                        const isSelected = selectedVariant?.size === size;
                        
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => {
                              if (!product.variants) return;
                              
                              // Find a variant with this size
                              let newVariant = selectedVariant?.color
                                ? product.variants!.find(v => 
                                    v.size === size && 
                                    v.color === selectedVariant.color &&
                                    v.quantity > 0
                                  )
                                : product.variants!.find(v => 
                                    v.size === size && 
                                    v.quantity > 0
                                  );
                              
                              // If no variant with current color, find first available color for this size
                              if (!newVariant) {
                                newVariant = product.variants!.find(v => 
                                  v.size === size && 
                                  v.quantity > 0
                                );
                              }
                              
                              if (newVariant) {
                                setSelectedVariant({
                                  size: newVariant.size,
                                  color: newVariant.color,
                                  material: newVariant.material
                                });
                              }
                            }}
                            disabled={!hasAnyVariant}
                            className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : hasAnyVariant
                                ? isAvailableWithCurrentColor
                                  ? 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                  : 'border-orange-300 dark:border-orange-600 hover:border-orange-400 dark:hover:border-orange-500 bg-orange-50/50 dark:bg-orange-900/10'
                                : 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                            }`}
                            title={!isAvailableWithCurrentColor && hasAnyVariant ? 'Chọn size này sẽ tự động chuyển sang màu khác' : ''}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Color Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Màu sắc:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(product.variants!.map(v => v.color))).map((color) => {
                        // Check if this color has any available variant (regardless of size)
                        const hasAnyVariant = product.variants!.some(v => 
                          v.color === color && v.quantity > 0
                        );
                        
                        // Check if this color is available with current size (for visual feedback)
                        const isAvailableWithCurrentSize = selectedVariant?.size
                          ? product.variants!.some(v => 
                              v.color === color && 
                              v.size === selectedVariant.size && 
                              v.quantity > 0
                            )
                          : true;
                        
                        const isSelected = selectedVariant?.color === color;
                        
                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => {
                              if (!product.variants) return;
                              
                              // Find a variant with this color
                              let newVariant = selectedVariant?.size
                                ? product.variants!.find(v => 
                                    v.color === color && 
                                    v.size === selectedVariant.size &&
                                    v.quantity > 0
                                  )
                                : product.variants!.find(v => 
                                    v.color === color && 
                                    v.quantity > 0
                                  );
                              
                              // If no variant with current size, find first available size for this color
                              if (!newVariant) {
                                newVariant = product.variants!.find(v => 
                                  v.color === color && 
                                  v.quantity > 0
                                );
                              }
                              
                              if (newVariant) {
                                setSelectedVariant({
                                  size: newVariant.size,
                                  color: newVariant.color,
                                  material: newVariant.material
                                });
                              }
                            }}
                            disabled={!hasAnyVariant}
                            className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : hasAnyVariant
                                ? isAvailableWithCurrentSize
                                  ? 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                  : 'border-orange-300 dark:border-orange-600 hover:border-orange-400 dark:hover:border-orange-500 bg-orange-50/50 dark:bg-orange-900/10'
                                : 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                            }`}
                            title={!isAvailableWithCurrentSize && hasAnyVariant ? 'Chọn màu này sẽ tự động chuyển sang size khác' : ''}
                          >
                            {color}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedVariant && (() => {
                    const currentVariant = product.variants!.find(v => 
                      v.size === selectedVariant.size && 
                      v.color === selectedVariant.color
                    );
                    if (!currentVariant) return null;
                  })()}
                </div>
              )}

              {/* Stock */}
              <div>
                <span className="text-gray-600 dark:text-gray-400">Tình trạng: </span>
                <span className={`font-medium ${
                  (() => {
                    if (product.variants && product.variants.length > 0 && selectedVariant) {
                      const currentVariant = product.variants.find(v => 
                        v.size === selectedVariant.size && 
                        v.color === selectedVariant.color
                      );
                      return currentVariant && currentVariant.quantity > 0 ? 'text-green-600' : 'text-red-600';
                    }
                    return product.stock > 0 ? 'text-green-600' : 'text-red-600';
                  })()
                }`}>
                  {(() => {
                    if (product.variants && product.variants.length > 0 && selectedVariant) {
                      const currentVariant = product.variants.find(v => 
                        v.size === selectedVariant.size && 
                        v.color === selectedVariant.color
                      );
                      return currentVariant 
                        ? (currentVariant.quantity > 0 ? `Còn ${currentVariant.quantity} sản phẩm` : 'Hết hàng')
                        : 'Vui lòng chọn loại sản phẩm';
                    }
                    return product.stock > 0 ? `Còn ${product.stock} sản phẩm` : 'Hết hàng';
                  })()}
                </span>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center gap-4">
                <span className="text-gray-600 dark:text-gray-400">Số lượng:</span>
                <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                  <button
                    onClick={() => {
                      const newQuantity = Math.max(1, quantity - 1);
                      setQuantity(newQuantity);
                      setQuantityInput(newQuantity.toString());
                    }}
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantityInput}
                    onChange={(e) => {
                      const value =  e.target.value;
                      setQuantityInput(value);

                      const numValue = parseInt(value);
                      const maxQuantity = (() => {
                        if (product.variants && product.variants.length > 0 && selectedVariant) {
                          const currentVariant = product.variants.find(v => 
                            v.size === selectedVariant.size && 
                            v.color === selectedVariant.color
                          );
                          return Math.min(10, currentVariant?.quantity || 0);
                        }
                        return Math.min(10, product.stock);
                      })();
                      
                      if (!isNaN(numValue) && numValue > 0) {
                        if (numValue > maxQuantity) {
                          setQuantityInput(maxQuantity.toString());
                          setQuantity(maxQuantity);
                        } else {
                          setQuantityInput(value);
                          setQuantity(numValue);
                        }
                      } else {
                        setQuantityInput(value);
                      }
                    }}
                    onBlur={(e) => {
                      const numValue = parseInt(e.target.value);
                      const maxQuantity = (() => {
                        if (product.variants && product.variants.length > 0 && selectedVariant) {
                          const currentVariant = product.variants.find(v => 
                            v.size === selectedVariant.size && 
                            v.color === selectedVariant.color
                          );
                          return Math.min(10, currentVariant?.quantity || 0);
                        }
                        return Math.min(10, product.stock);
                      })();
                      
                      if (isNaN(numValue) || numValue < 1 || e.target.value === '') {
                        setQuantityInput('1');
                        setQuantity(1);
                      } else if (numValue > maxQuantity) {
                        setQuantityInput(maxQuantity.toString());
                        setQuantity(maxQuantity);
                      } else {
                        setQuantityInput(numValue.toString());
                        setQuantity(numValue);
                      }
                    }}
                    className="w-16 text-center border-x border-gray-300 dark:border-gray-600 py-2 dark:bg-gray-800  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    min={0}
                    max={(() => {
                      if (product.variants && product.variants.length > 0 && selectedVariant) {
                        const currentVariant = product.variants.find(v => 
                          v.size === selectedVariant.size && 
                          v.color === selectedVariant.color
                        );
                        return Math.min(10, currentVariant?.quantity || 0);
                      }
                      return Math.min(10, product.stock);
                    })()}
                  />
                  <button
                    onClick={() => {
                      const maxQuantity = (() => {
                        if (product.variants && product.variants.length > 0 && selectedVariant) {
                          const currentVariant = product.variants.find(v => 
                            v.size === selectedVariant.size && 
                            v.color === selectedVariant.color
                          );
                          return Math.min(10, currentVariant?.quantity || 0);
                        }
                        return Math.min(10, product.stock);
                      })();
                      const newQuantity = Math.min(maxQuantity, quantity + 1);
                      setQuantity(newQuantity);
                      setQuantityInput(newQuantity.toString());
                    }}
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    disabled={(() => {
                      if (product.variants && product.variants.length > 0 && selectedVariant) {
                        const currentVariant = product.variants.find(v => 
                          v.size === selectedVariant.size && 
                          v.color === selectedVariant.color
                        );
                        return quantity >= (currentVariant?.quantity || 0);
                      }
                      return quantity >= product.stock;
                    })()}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={(() => {
                    if (product.variants && product.variants.length > 0) {
                      if (!selectedVariant) return true;
                      const currentVariant = product.variants.find(v => 
                        v.size === selectedVariant.size && 
                        v.color === selectedVariant.color
                      );
                      return !currentVariant || currentVariant.quantity === 0;
                    }
                    return product.stock === 0;
                  })()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Thêm vào giỏ
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={(() => {
                    if (product.variants && product.variants.length > 0) {
                      if (!selectedVariant) return true;
                      const currentVariant = product.variants.find(v => 
                        v.size === selectedVariant.size && 
                        v.color === selectedVariant.color
                      );
                      return !currentVariant || currentVariant.quantity === 0;
                    }
                    return product.stock === 0;
                  })()}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Mua ngay
                </button>
              </div>

              {/* Secondary Actions */}
              {/* <div className="flex gap-4">
                <button className="flex-1 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                  <Heart className="w-5 h-5" />
                  Yêu thích
                </button>
                <button className="flex-1 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                  <Share2 className="w-5 h-5" />
                  Chia sẻ
                </button>
              </div> */}

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col items-center text-center">
                  <Truck className="w-8 h-8 text-blue-600 mb-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Miễn phí vận chuyển</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <Shield className="w-8 h-8 text-blue-600 mb-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Bảo hành chính hãng</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <RotateCcw className="w-8 h-8 text-blue-600 mb-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Đổi trả 7 ngày</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description & Specifications */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Description */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Mô tả sản phẩm
                </h2>
                <div className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {product.description || 'Chưa có mô tả'}
                </div>
              </div>

              {/* Specifications */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Thông số kỹ thuật
                  </h2>
                  <div className="space-y-2">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700"
                      >
                        <span className="text-gray-600 dark:text-gray-400">{key}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reviews */}
          <div id="reviews" className="border-t border-gray-200 dark:border-gray-700 p-8 scroll-mt-20">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Đánh giá sản phẩm</h2>
            <div className="space-y-4">
              {reviews.slice(0, currentPage * reviewsPerPage).map((review, index) => (
                <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < Math.round(review.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mt-2">{review.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{review.body_review}</p>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{new Date(review.created_at).toLocaleDateString()}</span>
                </div>
              ))}
              {reviews.length > currentPage * reviewsPerPage && (
                <button
                  onClick={handleLoadMore}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
                >
                  Xem thêm
                </button>
              )}
            </div>

            <form onSubmit={handleReviewSubmit} className="mt-4">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setNewReview((prev) => ({ ...prev, rating: i + 1 }))}
                    className={`w-8 h-8 ${i < newReview.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    <Star />
                  </button>
                ))}
              </div>
              <textarea
                value={newReview.body_review}
                onChange={(e) => setNewReview((prev) => ({ ...prev, body_review: e.target.value }))}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 mb-4"
                placeholder="Viết đánh giá của bạn..."
                rows={4}
              ></textarea>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
              >
                Gửi đánh giá
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
