'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
  RefreshCw,
  X,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { uploadAPI, forceClientLogout, apiClient, API_ENDPOINTS } from '@/lib/api';
import { processImages, formatFileSize, type ImageProcessingOptions } from '@/lib/imageUtils';
import { useToast } from '@/context/ToastContext';
import { useCategoryList } from '@/hooks/useApi';
import CategoryManagement from '@/components/admin/CategoryManagement';

// Variant structure
interface Variant {
  id: string;
  size: string;
  color: string;
  material: string;
  attribute?: string; // Thuộc tính cho đồ điện tử (VD: 128GB, 256GB)
  price: number;
  cost_price: number;
  quantity: number;
  created_at?: string;
}

// Product structure
interface Product {
  id: string;
  name: string;
  description?: string;
  category?: string;
  image_path?: string[];
  sold_count?: number;
  status: 'onsale' | 'offsale' | 'unavailable';
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  variants?: Variant[];
  // Computed fields for display
  price?: number; // Min price from variants
  quantity?: number; // Total quantity from variants
}

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  status: 'onsale' | 'offsale' | 'unavailable';
  images: string[];
  variants: Variant[];
}

export default function InventoryManagement() {
  const { showError, showSuccess, showWarning } = useToast();
  
  // States for tabs
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  
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
  
  // States for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [paginationInfo, setPaginationInfo] = useState({
    has_next: false,
    has_prev: false,
    page: 1,
    pages: 1,
    total: 0
  });
  
  // States for product form modal
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    category: '',
    status: 'onsale',
    images: [],
    variants: []
  });
  
  // States for image upload
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imageQuality, setImageQuality] = useState(0.8);
  const [maxImageSize, setMaxImageSize] = useState(1920);

  // Fetch categories from API
  const { data: categoriesData, loading: categoriesLoading, refetch: refetchCategories } = useCategoryList();
  
  // Extract categories from API response - keep full objects for code lookup
  const categories = Array.isArray(categoriesData)
    ? categoriesData.map((cat: any) => typeof cat === 'string' ? { name: cat, code: '' } : { name: cat.name, code: cat.code || '', id: cat.id })
    : [];
  
  // Helper function to get category code by name
  const getCategoryCode = (categoryName: string): string => {
    const category = categories.find((cat: any) => cat.name === categoryName);
    return category?.code || '';
  };

  // Helper function to get category id by name
  const getCategoryId = (categoryName: string): string => {
    const category = categories.find((cat: any) => cat.name === categoryName);
    return category?.id || '';
  };

  // Helper function to compute display fields from variants
  const computeProductDisplayFields = (product: Product): Product => {
    if (product.variants && product.variants.length > 0) {
      product.price = Math.min(...product.variants.map(v => v.price));
      product.quantity = product.variants.reduce((sum, v) => sum + v.quantity, 0);
    }
    return product;
  };

  const fetchProducts = useCallback(async () => { 
    setLoading(true);
    setError(null);
    try {
      // Build query params
      const params = new URLSearchParams();
      params.append('user', 'true');
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (selectedCategory !== 'all') {
        const categoryCode = getCategoryCode(selectedCategory);
        if (categoryCode) {
          params.append('category', categoryCode);
        }
      }
      if (sortBy) {
        params.append('sortBy', sortBy === 'createdAt' ? 'created_at' : sortBy);
      }
      if (sortOrder) {
        params.append('sortOrder', sortOrder);
      }
      
      const data = await apiClient.get<any>(`/api/products?${params.toString()}`);
      
      const bodyErr = data && (data.error || data.message || data.msg);
      if (typeof bodyErr === 'string' && /token\s*(is\s*)?expired|expired\s*token/i.test(bodyErr)) {
        forceClientLogout();
        return;
      }
      
      const productList = Array.isArray(data) ? data : data?.data ?? [];
      // Ensure variants exist and compute display fields
      const transformedProducts = productList.map((item: any) => {
        const product: Product = {
          ...item,
          variants: item.variants || []
        };
        return computeProductDisplayFields(product);
      });
      setProducts(transformedProducts);
      
      // Update pagination info from API response
      if (data && !Array.isArray(data)) {
        setPaginationInfo({
          has_next: data.has_next || false,
          has_prev: data.has_prev || false,
          page: data.page || currentPage,
          pages: data.pages || 1,
          total: data.total || transformedProducts.length
        });
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Lỗi khi tải dữ liệu';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedCategory, sortBy, sortOrder, itemsPerPage]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Filter products by status only (search, category, sort are handled by API)
  const filteredProducts = useMemo(() => {
    if (selectedStatus === 'all') {
      return products;
    }
    return products.filter(product => product.status === selectedStatus);
  }, [products, selectedStatus]);

  // Reset to page 1 when filters change (except currentPage itself)
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, sortBy, sortOrder]);



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
      
      const totalSavings = results.reduce((sum, result) => sum + (result.originalSize - result.compressedSize), 0);
      if (totalSavings > 0) {
      }
      
      setSelectedFiles(prev => [...prev, ...processedFiles]); 
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
      
  // Use centralized apiClient so auth header and refresh flow are handled
  const data = await apiClient.post<any>(API_ENDPOINTS.UPLOAD.PRESIGNED_URL, filesRequest);

  // Backend returns { data: [...], success: true, total: N }
  const presignedData = (data as any).data || (data as any).results || [];
      
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
    
    // Validate variants
    if (formData.variants.length === 0) {
      showError('Vui lòng thêm ít nhất một loại sản phẩm (size, màu sắc)');
      return;
    }
    
    try {
      setUploadingImages(true);
      

  let imageKeys: string[] = (formData.images || []).map((img: string) => extractS3Key(img));
      
      if (selectedFiles.length > 0) {
        const { s3Keys: uploadedKeys } = await uploadImages(selectedFiles);
        imageKeys = [...imageKeys, ...uploadedKeys];
      }
      
      // Prepare product payload
      const now = new Date().toISOString();
      const productPayload: any = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        status: formData.status,
        image_path: imageKeys,
        variants: formData.variants.map(variant => ({
          id: variant.id || `${editingProduct?.id || 'NEW'}-${variant.size}-${variant.color}`.toUpperCase().replace(/\s+/g, '-'),
          size: variant.size || '',
          color: variant.color || '',
          material: variant.material || '',
          attribute: variant.attribute || '',
          price: variant.price,
          cost_price: variant.cost_price,
          quantity: variant.quantity,
          created_at: variant.created_at || now
        }))
      };

      if (editingProduct?.id) {
        productPayload.id = editingProduct.id;
      }

      // Save product to API via proxy
      const url = '/api/products';
      
      if (editingProduct) {
        await apiClient.put(url, productPayload);
      } else {
        await apiClient.post(url, productPayload);
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
      category: '',
      status: 'onsale',
      images: [],
      variants: []
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
    // Use full URLs for display in the edit modal so thumbnails render correctly.
    // We will extract S3 keys from these URLs when submitting the form.
    const displayImages = imagePaths;

    // Ensure status is always valid (default to 'onsale' if empty or invalid)
    const validStatus = (product.status as any) || 'onsale';
    const isValidStatus = ['onsale', 'offsale', 'unavailable'].includes(validStatus);
    
    setFormData({
      name: product.name,
      description: product.description || '',
      category: product.category || '',
      status: isValidStatus ? (validStatus as any) : 'onsale',
      images: displayImages, // Store full URLs for display; extract keys on submit
      variants: product.variants || []
    });
    setShowModal(true);
  };

  // Variant management functions
  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, {
        id: '',
        size: '',
        color: '',
        material: '',
        attribute: '',
        price: 0,
        cost_price: 0,
        quantity: 0
      }]
    }));
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((v, i) => 
        i === index ? { ...v, [field]: value } : v
      )
    }));
  };

  const removeVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  // Delete product
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
      await apiClient.delete(`/api/products?id=${productToDelete.id}`);
      
      await fetchProducts();
      showSuccess('Xóa sản phẩm thành công!');
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (error: any) {
      const errorMsg = error.message || 'Lỗi khi xóa sản phẩm';
      setError(errorMsg);
      showError(errorMsg);
      setShowDeleteModal(false);
      setProductToDelete(null);
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
          
          {activeTab === 'products' && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
              type="submit"
              style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 100 }} // Fixed position to ensure visibility.
            >
              <Plus className="w-4 h-4" />
              Thêm sản phẩm
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('products')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'products'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
            }`}
          >
            Sản phẩm
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
            }`}
          >
            Danh mục
          </button>
        </nav>
      </div>

      {/* Category Management Tab */}
      {activeTab === 'categories' && (
        <div className="bg-gray-900 rounded-lg p-6">
          <CategoryManagement onCategoriesChange={refetchCategories} />
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <>
      {/* Filters and Search */}
      <div className="bg-white/5 rounded-lg p-4 flex items-center justify-end">
        <div className="grid auto-cols-max grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 w-fit ml-auto">
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
            disabled={categoriesLoading}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="all">{categoriesLoading ? 'Đang tải...' : 'Tất cả danh mục'}</option>
            {categories.map((category: any) => (
              <option key={category.name || category.id || category} value={category.name || category}>
                {category.name || category}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          {/* <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="onsale">Đang bán</option>
            <option value="offsale">Không bán</option>
            <option value="unavailable">Không có sẵn</option>
          </select> */}

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
                  <th className="px-4 py-3 text-left text-white font-medium">Đã bán</th>
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
                        <p className="text-xs text-gray-400 mt-1">ID: {product.id}</p>
                        <div className="text-xs text-gray-500 mt-1">
                          <p className="text-gray-400">{product.category}</p>
                          {product.category && getCategoryCode(product.category) && (
                            <p className="text-gray-500 mt-0.5">Mã: {getCategoryCode(product.category)}</p>
                          )}
                        </div>
                        {product.variants && product.variants.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs font-medium text-gray-400">
                              {product.variants.length} loại sản phẩm:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {product.variants.slice(0, 3).map((variant, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-700/50 rounded text-xs text-gray-300"
                                  title={`Size: ${variant.size}, Màu: ${variant.color}, SL: ${variant.quantity}`}
                                >
                                  <span className="font-medium">{variant.size}</span>
                                  <span className="text-gray-500">•</span>
                                  <span>{variant.color}</span>
                                </span>
                              ))}
                              {product.variants.length > 3 && (
                                <span className="inline-flex items-center px-2 py-0.5 bg-gray-700/50 rounded text-xs text-gray-400">
                                  +{product.variants.length - 3} loại khác
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {product.variants && product.variants.length > 0 ? (
                        <div className="text-white">
                          <div className="font-medium">
                            {new Intl.NumberFormat('vi-VN', { 
                              style: 'currency', 
                              currency: 'VND' 
                            }).format(Math.min(...product.variants.map(v => v.price)))}
                          </div>
                          {Math.min(...product.variants.map(v => v.price)) !== Math.max(...product.variants.map(v => v.price)) && (
                            <div className="text-xs text-gray-400 mt-0.5">
                              ~ {new Intl.NumberFormat('vi-VN', { 
                                style: 'currency', 
                                currency: 'VND' 
                              }).format(Math.max(...product.variants.map(v => v.price)))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <span className={`font-medium ${(product.quantity || 0) === 0 ? 'text-red-400' : 'text-white'}`}>
                          {product.quantity || 0}
                        </span>
                        {product.variants && product.variants.length > 0 && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {product.variants.filter(v => v.quantity === 0).length > 0 && (
                              <span className="text-red-400">
                                {product.variants.filter(v => v.quantity === 0).length} loại hết hàng
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-white font-medium">
                        {product.sold_count}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        product.status === 'onsale' ? 'bg-green-500/20 text-green-400 text-center' :
                        product.status === 'offsale' ? 'bg-gray-500/20 text-gray-400 text-center' :
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
                          onClick={() => handleDeleteClick(product)}
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

      {/* Pagination */}
      {!loading && paginationInfo.total > 0 && paginationInfo.pages > 1 && (
        <div className="flex items-center justify-between px-4 py-4 bg-white/5 rounded-lg border border-white/10">
          <div className="text-sm text-gray-300">
            Trang {paginationInfo.page} / {paginationInfo.pages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={!paginationInfo.has_prev || currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Trước
            </button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, paginationInfo.pages) }, (_, i) => {
                let pageNum;
                if (paginationInfo.pages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= paginationInfo.pages - 2) {
                  pageNum = paginationInfo.pages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-700 text-white border border-gray-600 hover:bg-gray-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(paginationInfo.pages, prev + 1))}
              disabled={!paginationInfo.has_next || currentPage === paginationInfo.pages}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {/* No Products */}
      {!loading && filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">
            {paginationInfo.total === 0 ? 'Chưa có sản phẩm nào' : 'Không tìm thấy sản phẩm'}
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
              className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl lg:max-w-4xl max-h-[95vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-700">
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
              
              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
              
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

                {/* Variants Management */}
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300">
                      Loại sản phẩm (Size, Màu sắc) *
                    </label>
                  </div>

                  {formData.variants.length === 0 ? (
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-center text-gray-400">
                      Chưa có loại sản phẩm nào. Vui lòng thêm ít nhất một loại sản phẩm.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.variants.map((variant, index) => (
                        <div key={index} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-white">Loại sản phẩm {index + 1}</h4>
                            <button
                              type="button"
                              onClick={() => removeVariant(index)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {/* Size - Luôn hiển thị trong form */}
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Size</label>
                              <select
                                value={variant.size || ''}
                                onChange={(e) => updateVariant(index, 'size', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                              >
                                <option value="">Không có size</option>
                                <option value="S">S</option>
                                <option value="M">M</option>
                                <option value="L">L</option>
                                <option value="XL">XL</option>
                              </select>
                            </div>

                            {/* Thuộc tính - Luôn hiển thị trong form */}
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Loại</label>
                              <input
                                type="text"
                                value={variant.attribute || ''}
                                onChange={(e) => updateVariant(index, 'attribute', e.target.value)}
                                placeholder="VD: 128GB, 256GB..."
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                              />
                            </div>

                            {/* Color - Chỉ hiển thị nếu có giá trị hoặc đang trong form */}
                            {(variant.color || true) && (
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Màu sắc</label>
                                <input
                                  type="text"
                                  value={variant.color || ''}
                                  onChange={(e) => updateVariant(index, 'color', e.target.value)}
                                  placeholder="Đỏ, Xanh... (tùy chọn)"
                                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                              </div>
                            )}

                            {/* Material */}
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Chất liệu</label>
                              <input
                                type="text"
                                value={variant.material}
                                onChange={(e) => updateVariant(index, 'material', e.target.value)}
                                placeholder="Cotton, Polyester... (tùy chọn)"
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                              />
                            </div>

                            {/* Price */}
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Giá bán (VND) *</label>
                              <input
                                type="text"
                                required
                                value={variant.price.toLocaleString('vi-VN', { maximumFractionDigits: 0 }).replace(/,/g, '.')}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\./g, '');
                                  updateVariant(index, 'price', value ? Number(value) : 0);
                                }}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                              />
                            </div>

                            {/* Cost Price */}
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Giá vốn (VND) *</label>
                              <input
                                type="text"
                                required
                                value={variant.cost_price.toLocaleString('vi-VN', { maximumFractionDigits: 0 }).replace(/,/g, '.')}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\./g, '');
                                  updateVariant(index, 'cost_price', value ? Number(value) : 0);
                                }}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                              />
                            </div>

                            {/* Quantity */}
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Số lượng *</label>
                              <input
                                type="text"
                                required
                                value={variant.quantity.toLocaleString('vi-VN', { maximumFractionDigits: 0 }).replace(/,/g, '.')}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\./g, '');
                                  updateVariant(index, 'quantity', value ? Number(value) : 0);
                                }}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Button thêm variant ở dưới danh sách */}
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={addVariant}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm loại sản phẩm
                    </button>
                  </div>
                </div>

                {/* Category and SKU */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Danh mục
                      {editingProduct && (
                        <span className="ml-2 text-xs text-gray-500">(Không thể chỉnh sửa)</span>
                      )}
                    </label>
                    <button
                      type="button"
                      onClick={() => !editingProduct && setShowCategoryModal(true)}
                      disabled={categoriesLoading || editingProduct !== null}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between hover:bg-gray-700 transition-colors"
                    >
                      <span className={formData.category ? 'text-white' : 'text-gray-400'}>
                        {formData.category || (categoriesLoading ? 'Đang tải danh mục...' : 'Chọn danh mục')}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>

                  {/* <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Trạng thái
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'onsale' | 'offsale' | 'unavailable' }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="onsale">Đang bán</option>
                      <option value="offsale">Ngừng bán</option>
                      <option value="unavailable">Không khả dụng</option>
                    </select>
                  </div> */}
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
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-500/20 rounded-full">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Xác nhận xóa
              </h3>
            </div>
            <p className="text-gray-300 mb-6">
              Bạn có chắc chắn muốn xóa sản phẩm <strong className="text-white">"{productToDelete.name}"</strong>? 
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Selection Modal */}
      {showCategoryModal && (
        <div className="modal-wrapper">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/75 z-[102]"
            onClick={() => {
              setShowCategoryModal(false);
              setCategorySearchTerm('');
            }}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-[103] flex items-center justify-center p-4">
            <div 
              className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h3 className="text-xl font-semibold text-white">Chọn danh mục</h3>
                <button
                  onClick={() => {
                    setShowCategoryModal(false);
                    setCategorySearchTerm('');
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search */}
              <div className="p-4 border-b border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm danh mục..."
                    value={categorySearchTerm}
                    onChange={(e) => setCategorySearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Category List */}
              <div className="flex-1 overflow-y-auto p-4">
                {categoriesLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
                    <p className="text-gray-400">Đang tải danh mục...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {categories
                      .filter((category: any) => {
                        if (!categorySearchTerm) return true;
                        const searchLower = categorySearchTerm.toLowerCase();
                        return (
                          category.name?.toLowerCase().includes(searchLower) ||
                          category.code?.toLowerCase().includes(searchLower)
                        );
                      })
                      .map((category: any) => (
                        <button
                          key={category.name}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, category: category.name }));
                            setShowCategoryModal(false);
                            setCategorySearchTerm('');
                          }}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                            formData.category === category.name
                              ? 'bg-orange-500/20 border-2 border-orange-500'
                              : 'bg-gray-700 hover:bg-gray-600 border-2 border-transparent'
                          }`}
                        >
                          <div className="font-medium text-white">{category.name}</div>
                          {category.code && (
                            <div className="text-sm text-gray-400 mt-1">Mã: {category.code}</div>
                          )}
                        </button>
                      ))}
                    {categories.filter((category: any) => {
                      if (!categorySearchTerm) return false;
                      const searchLower = categorySearchTerm.toLowerCase();
                      return (
                        category.name?.toLowerCase().includes(searchLower) ||
                        category.code?.toLowerCase().includes(searchLower)
                      );
                    }).length === 0 && categorySearchTerm && (
                      <div className="text-center py-8 text-gray-400">
                        Không tìm thấy danh mục nào
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-700 flex justify-end">
                <button
                  onClick={() => {
                    setShowCategoryModal(false);
                    setCategorySearchTerm('');
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Selection Modal */}
      {showCategoryModal && (
        <div className="modal-wrapper">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/75 z-[102]"
            onClick={() => {
              setShowCategoryModal(false);
              setCategorySearchTerm('');
            }}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-[103] flex items-center justify-center p-4">
            <div 
              className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h3 className="text-xl font-semibold text-white">Chọn danh mục</h3>
                <button
                  onClick={() => {
                    setShowCategoryModal(false);
                    setCategorySearchTerm('');
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search */}
              <div className="p-4 border-b border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm danh mục..."
                    value={categorySearchTerm}
                    onChange={(e) => setCategorySearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Category List */}
              <div className="flex-1 overflow-y-auto p-4">
                {categoriesLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
                    <p className="text-gray-400">Đang tải danh mục...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {categories
                      .filter((category: any) => {
                        if (!categorySearchTerm) return true;
                        const searchLower = categorySearchTerm.toLowerCase();
                        return (
                          category.name?.toLowerCase().includes(searchLower) ||
                          category.code?.toLowerCase().includes(searchLower)
                        );
                      })
                      .map((category: any) => (
                        <button
                          key={category.name}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, category: category.name }));
                            setShowCategoryModal(false);
                            setCategorySearchTerm('');
                          }}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                            formData.category === category.name
                              ? 'bg-orange-500/20 border-2 border-orange-500'
                              : 'bg-gray-700 hover:bg-gray-600 border-2 border-transparent'
                          }`}
                        >
                          <div className="font-medium text-white">{category.name}</div>
                          {category.code && (
                            <div className="text-sm text-gray-400 mt-1">Mã: {category.code}</div>
                          )}
                        </button>
                      ))}
                    {categories.filter((category: any) => {
                      if (!categorySearchTerm) return false;
                      const searchLower = categorySearchTerm.toLowerCase();
                      return (
                        category.name?.toLowerCase().includes(searchLower) ||
                        category.code?.toLowerCase().includes(searchLower)
                      );
                    }).length === 0 && categorySearchTerm && (
                      <div className="text-center py-8 text-gray-400">
                        Không tìm thấy danh mục nào
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-700 flex justify-end">
                <button
                  onClick={() => {
                    setShowCategoryModal(false);
                    setCategorySearchTerm('');
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}