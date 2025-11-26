'use client';

import { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Package,
  ArrowLeft,
  Download,
  Upload
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { useProducts, useDeleteProduct, useCategoryList } from '@/hooks/useApi';
import { formatPrice } from '@/lib/utils';
import CategoryManagement from './CategoryManagement';

interface ProductsResponse {
  data?: Product[];
  products?: Product[];
  total?: number;
  page?: number;
  limit?: number;
}

export default function ProductManagement() {
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // API params for products - memoized to prevent unnecessary re-renders
  const apiParams = useMemo(() => ({
    search: searchTerm || undefined,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    sortBy,
    sortOrder,
    page: currentPage,
    limit: itemsPerPage
  }), [searchTerm, selectedCategory, sortBy, sortOrder, currentPage, itemsPerPage]);

  // Use API hooks
  const { 
    data: productsResponse, 
    loading, 
    error, 
    refetch 
  } = useProducts(apiParams);

  const { 
    data: categoriesData, 
    loading: categoriesLoading,
    refetch: refetchCategories
  } = useCategoryList();

  const { 
    mutate: deleteProduct, 
    loading: deleteLoading 
  } = useDeleteProduct();  // Extract data from API response with proper typing
  const apiResponse = productsResponse as ProductsResponse;
  const products: Product[] = apiResponse?.data || apiResponse?.products || [];
  const totalProducts = apiResponse?.total || products.length || 0;
  const totalPages = Math.ceil(totalProducts / itemsPerPage);
  // Extract categories from API response - handle both array of objects and array of strings
  const categories = Array.isArray(categoriesData)
    ? categoriesData.map((cat: any) => typeof cat === 'string' ? cat : cat.name)
    : [];

  // Handle delete product
  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      await deleteProduct(productToDelete.id);
      // Refetch data after successful delete
      refetch();
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (error) {
      alert('Có lỗi xảy ra khi xóa sản phẩm');
      setShowDeleteModal(false);
      setProductToDelete(null);
    }
  };

  const getStockStatusColor = (stock: number) => {
    if (stock === 0) return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400';
    if (stock < 10) return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400';
    return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400';
  };

  const getStockStatusText = (stock: number) => {
    if (stock === 0) return 'Hết hàng';
    if (stock < 10) return 'Sắp hết';
    return 'Còn hàng';
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h3 className="text-red-800 dark:text-red-400 font-medium">Có lỗi xảy ra</h3>
            <p className="text-red-600 dark:text-red-500 mt-2">{error}</p>
            <button
              onClick={refetch}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin"
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Quản lý sản phẩm
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Quản lý tất cả sản phẩm trong cửa hàng
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </button>
                <Link
                  href="/admin/products/new"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm sản phẩm
                </Link>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('products')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'products'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Sản phẩm
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'categories'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Danh mục
              </button>
            </nav>
          </div>

          {/* Category Management Tab */}
          {activeTab === 'categories' && (
            <CategoryManagement onCategoriesChange={refetchCategories} />
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <>
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                disabled={categoriesLoading}
              >
                <option value="all">Tất cả danh mục</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="name">Tên sản phẩm</option>
                <option value="price">Giá</option>
                <option value="stock">Tồn kho</option>
                <option value="rating">Đánh giá</option>
              </select>

              {/* Sort Order */}
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="asc">Tăng dần</option>
                <option value="desc">Giảm dần</option>
              </select>
            </div>            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Hiển thị {products.length} trong tổng số {totalProducts} sản phẩm
              </p>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Trang {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Sản phẩm
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Danh mục
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Giá
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Tồn kho
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Trạng thái
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Đánh giá
                    </th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Thao tác
                    </th>
                  </tr>
                </thead>                <tbody>
                  {products.map((product: Product) => (
                    <tr key={product.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <div className="w-12 h-12 relative rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                              {product.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300 capitalize">
                        {product.category}
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-white">
                        {formatPrice(product.price)}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">
                        {product.stock}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockStatusColor(product.stock)}`}>
                          {getStockStatusText(product.stock)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">
                        {product.rating}/5 ({product.reviews})
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/products/${product.id}`}
                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(product)}
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>            {products.length === 0 && !loading && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
                  Không tìm thấy sản phẩm nào
                </p>
                <p className="text-gray-500 dark:text-gray-500 mt-2">
                  Thử thay đổi bộ lọc hoặc thêm sản phẩm mới
                </p>
              </div>
            )}
          </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Xác nhận xóa
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Bạn có chắc chắn muốn xóa sản phẩm <strong>"{productToDelete.name}"</strong>? 
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleDeleteCancel}
                disabled={deleteLoading}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteLoading ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
