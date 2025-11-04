'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Package,
  Upload,
  Image as ImageIcon,
  Filter,
  SortAsc,
  SortDesc,
  Download,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { uploadAPI } from '@/lib/api';
import { forceClientLogout } from '@/lib/api';
import { processImages, formatFileSize, type ImageProcessingOptions } from '@/lib/imageUtils';
import { useToast } from '@/context/ToastContext';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  category?: string;
  image_path?: string[]; // Now accepts array of image paths
  sku?: string;
  status: 'onsale' | 'offsale' | 'unavailable';
  createdAt?: string;
  updatedAt?: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
  sku?: string;
  status: 'onsale' | 'offsale' | 'unavailable';
  images: string[]; // Keep images array for internal use
}

export default function InventoryManagement() {
  const { showError, showSuccess, showWarning } = useToast();
  
  // States for product list
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // States for filtering and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'quantity' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // States for product form modal
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    quantity: 0,
    category: '',
    sku: '',
    status: 'onsale',
    images: []
  });
  
  // States for image upload
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imageQuality, setImageQuality] = useState(0.8);
  const [maxImageSize, setMaxImageSize] = useState(1920);

  // Categories (could be fetched from API)
  const categories = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Other'];

  // Fetch products from API via proxy
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') || localStorage.getItem('auth_token') : null;
      
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch('/api/products?user=true', { headers });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      
      // Check for token expiration
      const bodyErr = data && (data.error || data.message || data.msg);
      if (typeof bodyErr === 'string' && /token\s*(is\s*)?expired|expired\s*token/i.test(bodyErr)) {
        forceClientLogout();
        return;
      }
      
      const productList = Array.isArray(data) ? data : data?.data ?? [];
      setProducts(productList);
    } catch (err: any) {
      const errorMsg = err?.message || 'Lỗi khi tải dữ liệu';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Sort products
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];
      
      // Handle undefined values
      if (aValue === undefined) aValue = '';
      if (bValue === undefined) bValue = '';
      
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [products, searchTerm, selectedCategory, selectedStatus, sortBy, sortOrder]);



  // Handle file selection for image upload (multiple images)
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      alert('Chỉ có thể upload file ảnh');
      return;
    }
    
    try {
      setUploadingImages(true);
      
      // Process images with current settings
      const options: ImageProcessingOptions = {
        quality: imageQuality,
        maxWidth: maxImageSize,
        maxHeight: maxImageSize,
        format: 'webp'
      };
      
      const results = await processImages(imageFiles, options, (processed, total) => {
      });
      
      // Extract processed files
      const processedFiles = results.map(result => result.file);
      
      // Show processing summary
      const totalSavings = results.reduce((sum, result) => sum + (result.originalSize - result.compressedSize), 0);
      if (totalSavings > 0) {
      }
      
      setSelectedFiles(prev => [...prev, ...processedFiles]); // Add to existing files
    } catch (error) {
      showError('Lỗi khi xử lý ảnh');
    } finally {
      setUploadingImages(false);
    }
  };

  // Upload images to S3 using presigned URL from proxy
  const uploadImages = async (files: File[]): Promise<{ s3Keys: string[] }> => {
    try {
      
      // Send array format to PROXY API
      const filesRequest = files.map(file => ({
        fileName: file.name,
        fileType: file.type
      }));
      
      // Get access token from localStorage
      const accessToken = localStorage.getItem('access_token') || localStorage.getItem('auth_token');
      if (!accessToken) {
        throw new Error('No access token found. Please login first.');
      }
      
      const response = await fetch('/upload/presigned-url', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(filesRequest)
      });
      
      if (!response.ok) {
        const errorMsg = 'Không thể lấy presigned URLs từ server';
        showError(errorMsg);
        throw new Error(errorMsg);
      }
      
      const data = await response.json();
     
      
      // Backend returns { data: [...], success: true, total: N }
      const presignedData = data.data || data.results || [];
      
      // Upload all files to S3 in parallel
      const uploadPromises = files.map(async (file, index) => {
        const item = presignedData[index];
        
        
        
        try {
          const uploadResponse = await fetch(item.presigned_url, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type,
              // 'x-amz-acl': 'public-read' // Backend signed with empty x-amz-acl
            },
          });
          
          
          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            const errorMsg = `Upload thất bại cho ${file.name}: ${uploadResponse.status}`;
            showError(errorMsg);
            throw new Error(errorMsg);
          }
        } catch (fetchError) {
          throw fetchError;
        }
        
        // Return only S3 key
        return item.s3_key;
      });
      
      const results = await Promise.all(uploadPromises);
      
      return {
        s3Keys: results
      };
      
    } catch (error) {
      throw error;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setUploadingImages(true);
      
      // Upload selected images and get S3 keys only
      let imageKeys: string[] = [...(formData.images as any[])];
      
      if (selectedFiles.length > 0) {
        const { s3Keys: uploadedKeys } = await uploadImages(selectedFiles);
        imageKeys = [...imageKeys, ...uploadedKeys];
      }
      
      // Send only S3 keys in image_path (backend will convert to full URLs)
      const productData = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        quantity: formData.quantity,
        category: formData.category,
        status: formData.status,
        image_path: imageKeys
      };


      // Save product to API
      // Save product to API via proxy
      const url = editingProduct 
        ? '/api/products'
        : '/api/products';
      
      const productPayload = editingProduct 
        ? { id: editingProduct.id, ...productData }
        : productData;
      
      const token = localStorage.getItem('access_token') || localStorage.getItem('auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, {
        method: editingProduct ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(productPayload),
      });

      if (!response.ok) {
        const errorMsg = 'Không thể lưu sản phẩm';
        showError(errorMsg);
        throw new Error(errorMsg);
      }

      // Refresh products list
      await fetchProducts();
      
      showSuccess(editingProduct ? 'Cập nhật sản phẩm thành công!' : 'Thêm sản phẩm thành công!');
      
      // Close modal
      setShowModal(false);
      resetForm();
      
    } catch (error: any) {
      const errorMsg = error.message || 'Lỗi khi lưu sản phẩm';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setUploadingImages(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      quantity: 0,
      category: '',
      sku: '',
      status: 'onsale',
      images: []
    });
    setEditingProduct(null);
    setSelectedFiles([]);
    // Reset image settings to default
    setImageQuality(0.8);
    setMaxImageSize(1920);
  };

  // Helper function to extract pure S3 key from full URL or encoded path
  const extractS3Key = (imageUrl: string): string => {
    try {
      // Case 1: Full presigned URL - https://go-ecom1.s3.ap-southeast-1.amazonaws.com/{s3_key}?...
      if (imageUrl.includes('amazonaws.com')) {
        const urlObj = new URL(imageUrl);
        let pathname = urlObj.pathname;
        // Remove leading slash
        if (pathname.startsWith('/')) {
          pathname = pathname.slice(1);
        }
        return pathname;
      }
      
      // Case 2: Encoded URL starting with https%3A
      if (imageUrl.includes('https%3A')) {
        // This is an encoded URL, need to extract S3 key part after 'product-images/'
        const match = imageUrl.match(/product-images\/[^/?]+/);
        if (match) {
          return match[0];
        }
      }
      
      // Case 3: Plain S3 key (e.g., product-images/xxxxx.webp)
      if (imageUrl.includes('product-images/')) {
        const match = imageUrl.match(/product-images\/[^/?&]+/);
        if (match) {
          return match[0];
        }
      }
      
      // Default: return as-is if already a key
      return imageUrl;
    } catch (error) {
      console.warn('Failed to extract S3 key:', error);
      return imageUrl;
    }
  };

  // Open modal for editing
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    const imagePaths = product.image_path || [];
    // Extract S3 keys from full URLs
    const s3Keys = imagePaths.map(extractS3Key);
    
    // Ensure status is always valid (default to 'onsale' if empty or invalid)
    const validStatus = (product.status as any) || 'onsale';
    const isValidStatus = ['onsale', 'offsale', 'unavailable'].includes(validStatus);
    
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      quantity: product.quantity,
      category: product.category || '',
      sku: product.sku || '',
      status: isValidStatus ? (validStatus as any) : 'onsale',
      images: s3Keys // Store S3 keys, not full URLs
    });
    setShowModal(true);
  };

  // Delete product
  const handleDelete = async (productId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('auth_token');
      const headers: Record<string, string> = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/products?id=${productId}`, {
        method: 'DELETE',
        headers,
      });
      
      if (!response.ok) throw new Error('Failed to delete product');
      
      await fetchProducts();
      showSuccess('Xóa sản phẩm thành công!');
    } catch (error: any) {
      const errorMsg = error.message || 'Lỗi khi xóa sản phẩm';
      setError(errorMsg);
      showError(errorMsg);
    }
  };

  // Remove existing image from form
  const removeExistingImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Remove selected file
  const removeSelectedImage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Quản Lý Kho Hàng</h2>
          <p className="text-gray-300 mt-1">Quản lý sản phẩm và hàng tồn kho</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={fetchProducts}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
          
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white/5 rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="onsale">Đang bán</option>
            <option value="offsale">Không bán</option>
            <option value="unavailable">Không có sẵn</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="name">Sắp xếp theo tên</option>
            <option value="price">Sắp xếp theo giá</option>
            <option value="quantity">Sắp xếp theo số lượng</option>
            <option value="createdAt">Sắp xếp theo ngày tạo</option>
          </select>

          {/* Sort Order */}
          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-gray-300">
        Hiển thị {filteredProducts.length} trong tổng số {products.length} sản phẩm
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      )}

      {/* Products Grid/Table */}
      {!loading && filteredProducts.length > 0 && (
        <div className="bg-white/5 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-white font-medium">Ảnh</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Thông tin</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Giá</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Số lượng</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-white/5">
                    <td className="px-4 py-4">
                      <div className="w-16 h-16 bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
                        {product.image_path && product.image_path.length > 0 ? (
                          <Image
                            src={product.image_path[0]} // Show first image as thumbnail
                            alt={product.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <h3 className="font-medium text-white">{product.name}</h3>
                        <p className="text-sm text-gray-400 mt-1">{product.sku}</p>
                        <p className="text-xs text-gray-500 mt-1">{product.category}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-white font-medium">
                      {new Intl.NumberFormat('vi-VN', { 
                        style: 'currency', 
                        currency: 'VND' 
                      }).format(product.price)}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`font-medium ${product.quantity === 0 ? 'text-red-400' : 'text-white'}`}>
                        {product.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        product.status === 'onsale' ? 'bg-green-500/20 text-green-400' :
                        product.status === 'offsale' ? 'bg-gray-500/20 text-gray-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {product.status === 'onsale' ? 'Đang bán' :
                         product.status === 'offsale' ? 'Không bán' :
                         'Không có sẵn'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Products */}
      {!loading && filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">
            {products.length === 0 ? 'Chưa có sản phẩm nào' : 'Không tìm thấy sản phẩm'}
          </h3>
          <p className="text-gray-400 mb-6">
            {products.length === 0 
              ? 'Thêm sản phẩm đầu tiên để bắt đầu bán hàng'
              : 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
            }
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm sản phẩm mới
          </button>
        </div>
      )}

      {/* Product Form Modal */}
      {showModal && (
        <div className="modal-wrapper">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/75 z-[100]"
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <div 
              className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl lg:max-w-4xl max-h-[95vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {editingProduct ? 'Cập nhật thông tin sản phẩm' : 'Tạo sản phẩm mới trong kho hàng'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="Đóng modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
              
              <form id="product-form" onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tên sản phẩm *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Price and Quantity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Giá (VND) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Số lượng *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Category and SKU */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Danh mục
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Mã SKU
                    </label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Trạng thái
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="onsale">Đang bán</option>
                    <option value="offsale">Không bán</option>
                    <option value="unavailable">Không có sẵn</option>
                  </select>
                </div>

                {/* Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Hình ảnh sản phẩm
                  </label>
                  
                  {/* Existing Images */}
                  {formData.images.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-400 mb-2">Ảnh hiện tại:</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.images.map((url, index) => (
                          <div key={index} className="relative">
                            <Image
                              src={url}
                              alt={`Product ${index + 1}`}
                              width={80}
                              height={80}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeExistingImage(index)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Selected Files */}
                  {selectedFiles.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-400 mb-2">Ảnh sẽ được tải lên (WebP):</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Selected ${index + 1}`}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 rounded-b-lg">
                              {formatFileSize(file.size)}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeSelectedImage(index)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-green-400 mt-2">
                        ✓ Tổng dung lượng: {formatFileSize(selectedFiles.reduce((total, file) => total + file.size, 0))}
                      </p>
                    </div>
                  )}

                  {/* File Input */}
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="image-upload"
                      disabled={uploadingImages}
                    />
                    <label htmlFor="image-upload" className={`cursor-pointer ${uploadingImages ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {uploadingImages ? (
                        <RefreshCw className="w-8 h-8 text-orange-400 mx-auto mb-2 animate-spin" />
                      ) : (
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      )}
                      <p className="text-gray-400">
                        {uploadingImages ? 'Đang xử lý ảnh...' : 'Chọn nhiều ảnh để tải lên'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, GIF → Tự động chuyển đổi sang WebP
                      </p>
                      <div className="mt-2 text-xs text-orange-400">
                        <p>🚀 WebP: Giảm 25-50% dung lượng</p>
                        <p>⚡ Chất lượng: {Math.round(imageQuality * 100)}% | Kích thước: {maxImageSize}px</p>
                        <p>📸 Tất cả ảnh sẽ được gửi lên server</p>
                      </div>
                      
                    </label>
                  </div>
                </div>

              </form>
            </div>
            
            {/* Fixed Form Actions */}
            <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-t border-gray-700 bg-gray-900">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 sm:px-6 py-2 text-gray-300 hover:text-white transition-colors"
                  disabled={uploadingImages}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  form="product-form"
                  disabled={uploadingImages}
                  className="px-4 sm:px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {uploadingImages && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {uploadingImages ? 'Đang xử lý...' : (editingProduct ? 'Cập nhật' : 'Thêm')}
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}