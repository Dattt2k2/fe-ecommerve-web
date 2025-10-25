import { notFound } from 'next/navigation';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { Star, ShoppingCart, Truck, Shield, RotateCcw } from 'lucide-react';
import AddToCartButton from '@/components/product/AddToCartButton';
import ProductActions from '@/components/product/ProductActions';
import ProductReviews from '@/components/product/ProductReviews';
import RelatedProducts from '@/components/product/RelatedProducts';
import ProductImageGallery from '@/components/product/ProductImageGallery';
import { Metadata } from 'next';
import { productsAPI } from '@/lib/api';

interface ProductPageProps {
  params: {
    id: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  try {
    // Use productsAPI helper which calls backend directly (avoids internal proxy issues)
    const res = await productsAPI.getProduct(params.id);
    const apiData = (res && (res.product || res)) as any;

    return {
      title: `${apiData?.name || 'Product'} | E-Commerce`,
      description: apiData?.description || 'Product details',
      openGraph: {
        title: apiData?.name,
        description: apiData?.description,
        images: Array.isArray(apiData?.image_path) ? [apiData.image_path[0]] : [apiData?.image_path || '/images/placeholder.jpg'],
      },
    };
  } catch (error) {
    // Keep metadata generation resilient — log structured info for debugging
    try {
      console.error('[Metadata] productsAPI.getProduct error:', typeof error === 'string' ? error : (error && ((error as any).message || JSON.stringify(error))));
    } catch {}
    return {
      title: 'Product | E-Commerce',
      description: 'Product details',
    };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  let product;
  let apiResponse;
  
  try {
    // Use productsAPI helper which has better fallback logic and works from server
    const response = await productsAPI.getProduct(params.id);
    apiResponse = response.product || response;

    if (!apiResponse) {
      console.error('[Product] API response is empty', response);
      notFound();
    }

    if (!apiResponse || (!apiResponse.id && !apiResponse.name)) {
      console.error('[Product] API response missing required fields:', apiResponse);
      notFound();
    }

    const apiData = apiResponse as any; // Cast to any to access backend fields
    
    // Helper function to validate and filter valid image URLs
    const getValidImageUrls = (imagePath: any): string[] => {
      if (!imagePath) return [];
      
      const urls = Array.isArray(imagePath) ? imagePath : [imagePath];
      return urls.filter((url: any) => {
        if (typeof url !== 'string' || !url) return false;
        // Check if it's a valid URL or path
        try {
          if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
            return true;
          }
          return false;
        } catch {
          return false;
        }
      });
    };
    
    const validImages = getValidImageUrls(apiData.image_path);
    const fallbackImage = '/images/placeholder.jpg';
    
    product = {
      id: apiData.id || params.id,
      name: apiData.name || 'Product Name',
      description: apiData.description || 'No description available',
      price: apiData.price || 0,
      originalPrice: apiData.originalPrice,
      category: apiData.category || 'Uncategorized',
      brand: apiData.brand,
      image: validImages.length > 0 ? validImages[0] : fallbackImage,
      images: validImages.length > 0 ? validImages : [fallbackImage],
      stock: apiData.quantity || apiData.stock || 0,
      rating: apiData.rating || 0, // Use actual rating from backend, 0 if no reviews
      reviews: apiData.rating_count || 0, // Number of reviews
      sold: apiData.sold,
      tags: apiData.tags || [],
      featured: apiData.featured,
      isActive: apiData.status === 'onsale' || apiData.isActive,
      isFeatured: apiData.isFeatured,
      specifications: apiData.specifications,
      createdAt: apiData.createdAt,
      updatedAt: apiData.updatedAt
    };
    
  } catch (error) {
    notFound();
  }

  if (!product) {
    notFound();
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
          {/* Product Images with Gallery */}
          <ProductImageGallery 
            images={product.images} 
            productName={product.name}
          />

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.round(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {product.rating > 0 ? (
                  `${product.rating.toFixed(1)}/5 (${product.reviews} đánh giá)`
                ) : (
                  'Chưa có đánh giá'
                )}
              </span>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {formatPrice(product.price)}
              </span>
              {product.stock > 0 ? (
                <span className="text-sm text-green-600 dark:text-green-400">
                  Còn {product.stock} sản phẩm
                </span>
              ) : (
                <span className="text-sm text-red-600 dark:text-red-400">
                  Hết hàng
                </span>
              )}
            </div>
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Add to Cart Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <AddToCartButton product={product} />
              <ProductActions />
            </div>
          </div>

          {/* Product Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-white">Miễn phí vận chuyển</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Đơn hàng từ 500k</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-white">Bảo hành chính hãng</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">12 tháng</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <RotateCcw className="w-5 h-5 text-orange-600" />
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-white">Đổi trả dễ dàng</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Trong 7 ngày</p>
              </div>
            </div>
          </div>
        </div>
      </div>      {/* Reviews Section */}
      <ProductReviews productId={params.id} />

      {/* Related Products */}
      <RelatedProducts currentProduct={product} />
      </div>
    </div>
  );
}
