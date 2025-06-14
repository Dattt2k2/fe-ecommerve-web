'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Eye, 
  Package, 
  TrendingUp,
  Calendar,
  Star,
  ShoppingCart,
  Users,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { Product } from '@/types';

interface ProductDetailProps {
  productId: string;
}

interface ProductStats {
  totalSold: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  viewCount: number;
  conversionRate: number;
}

export default function ProductDetail({ productId }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock data loading
  useEffect(() => {
    const loadProduct = async () => {
      try {
        // In a real app, you would fetch from API
        // For now, we'll use mock data
        const mockProduct: Product = {
          id: productId,
          name: 'iPhone 15 Pro Max',
          description: 'iPhone 15 Pro Max với chip A17 Pro mạnh mẽ nhất từ trước đến nay, camera 48MP tiên tiến với tính năng quay video ProRes và Action Button hoàn toàn mới.',
          price: 29990000,
          originalPrice: 32990000,
          image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500',
          images: [
            'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500',
            'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=500',
            'https://images.unsplash.com/photo-1567731209813-e32d6c0a7b52?w=500'
          ],
          category: 'Điện thoại',
          brand: 'Apple',
          rating: 4.8,
          reviews: 145,
          stock: 25,
          sold: 189,
          tags: ['flagship', 'camera', '5g', 'premium'],
          specifications: {
            'Màn hình': '6.7 inch Super Retina XDR',
            'Chip': 'A17 Pro',
            'Camera': 'Camera Chính 48MP + Ultra Wide 12MP + Telephoto 12MP',
            'Pin': 'Lên đến 29 giờ phát video',
            'Bộ nhớ': '256GB, 512GB, 1TB',
            'Màu sắc': 'Titan Tự Nhiên, Titan Xanh, Titan Trắng, Titan Đen'
          },
          isActive: true,
          isFeatured: true,
          createdAt: '2024-01-15T00:00:00Z',
          updatedAt: '2024-03-10T00:00:00Z'
        };

        const mockStats: ProductStats = {
          totalSold: 189,
          totalRevenue: 5670000000,
          averageRating: 4.8,
          totalReviews: 145,
          viewCount: 1250,
          conversionRate: 15.12
        };

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setProduct(mockProduct);
        setStats(mockStats);
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // In a real app, you would make an API call to delete the product
      console.log('Deleting product:', productId);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Sản phẩm đã được xóa thành công!');
      // In a real app, you would redirect to the products list
      window.history.back();
    } catch (error) {
      alert('Có lỗi xảy ra khi xóa sản phẩm!');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Không tìm thấy sản phẩm</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Sản phẩm với ID {productId} không tồn tại.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link 
            href="/admin/products"
            className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chi tiết sản phẩm</h1>
        </div>
        
        <div className="flex space-x-3">
          <Link
            href={`/admin/products/${productId}/edit`}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Edit className="h-4 w-4 mr-2" />
            Chỉnh sửa
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Xóa
          </button>
        </div>
      </div>

      {/* Product Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ShoppingCart className="h-6 w-6 text-green-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">Đã bán</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats?.totalSold}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <TrendingUp className="h-6 w-6 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">Doanh thu</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {stats ? formatCurrency(stats.totalRevenue) : '0'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Star className="h-6 w-6 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">Đánh giá</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {stats?.averageRating}/5
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="h-6 w-6 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">Reviews</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats?.totalReviews}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Eye className="h-6 w-6 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">Lượt xem</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats?.viewCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <TrendingUp className="h-6 w-6 text-indigo-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">Tỉ lệ chuyển đổi</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats?.conversionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Images */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Hình ảnh sản phẩm</h2>
          <div className="grid grid-cols-2 gap-4">
            {product.images?.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`${product.name} ${index + 1}`}
                className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
              />
            ))}
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Thông tin cơ bản</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Tên sản phẩm</label>
              <p className="text-lg font-medium text-gray-900 dark:text-white">{product.name}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Giá bán</label>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(product.price)}
                </p>
              </div>
              
              {product.originalPrice && product.originalPrice > product.price && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Giá gốc</label>
                  <p className="text-lg font-medium text-gray-500 dark:text-gray-400 line-through">
                    {formatCurrency(product.originalPrice)}
                  </p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Danh mục</label>
                <p className="text-gray-900 dark:text-white">{product.category}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Thương hiệu</label>
                <p className="text-gray-900 dark:text-white">{product.brand}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Tồn kho</label>
                <p className={`font-medium ${product.stock < 10 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                  {product.stock} sản phẩm
                  {product.stock < 10 && <span className="text-sm text-red-500 ml-2">(Sắp hết hàng)</span>}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Trạng thái</label>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    product.isActive 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                  }`}>
                    {product.isActive ? 'Hoạt động' : 'Tạm dừng'}
                  </span>
                  {product.isFeatured && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      Nổi bật
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Ngày tạo</label>
                <p className="text-gray-900 dark:text-white">
                  {product.createdAt ? formatDate(product.createdAt) : 'N/A'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Cập nhật cuối</label>
                <p className="text-gray-900 dark:text-white">
                  {product.updatedAt ? formatDate(product.updatedAt) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Specifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Description */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Mô tả sản phẩm</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{product.description}</p>
          
          {product.tags && product.tags.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Specifications */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Thông số kỹ thuật</h2>
          <div className="space-y-3">
            {Object.entries(product.specifications || {}).map(([key, value]) => (
              <div key={key} className="flex justify-between items-start border-b border-gray-200 dark:border-gray-700 pb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 flex-shrink-0 w-1/3">
                  {key}
                </span>
                <span className="text-sm text-gray-900 dark:text-white text-right flex-1">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Xác nhận xóa</h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Bạn có chắc chắn muốn xóa sản phẩm "{product.name}" không? 
              Hành động này không thể hoàn tác.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-red-300 transition-colors"
              >
                {isDeleting ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
