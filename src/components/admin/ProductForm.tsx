'use client';

import { useState, useEffect } from 'react';
import { Upload, X, Plus, Minus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import { useProduct, useCreateProduct, useUpdateProduct } from '@/hooks/useApi';

interface ProductFormProps {
  productId?: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  stock: number;
  images: string[];
  specifications: { key: string; value: string }[];
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
}

const categories = [
  'Điện thoại',
  'Laptop',
  'Tablet',
  'Phụ kiện',
  'Tai nghe',
  'Đồng hồ thông minh',
  'Máy ảnh',
  'Gaming'
];

const brands = [
  'Apple',
  'Samsung',
  'Xiaomi',
  'OPPO',
  'Vivo',
  'Huawei',
  'Sony',
  'Dell',
  'HP',
  'Asus',
  'Lenovo',
  'MSI'
];

export default function ProductForm({ productId }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!productId;
  
  // API hooks
  const { data: productData, loading: productLoading } = useProduct(productId || '');
  const { mutate: createProduct, loading: createLoading } = useCreateProduct();
  const { mutate: updateProduct, loading: updateLoading } = useUpdateProduct();
  
  const isLoading = createLoading || updateLoading;

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    category: '',
    brand: '',
    stock: 0,
    images: [],
    specifications: [{ key: '', value: '' }],
    tags: [],
    isActive: true,
    isFeatured: false,
    seo: {
      title: '',
      description: '',
      keywords: ''
    }
  });

  const [newTag, setNewTag] = useState('');  const [errors, setErrors] = useState<Record<string, string>>({});
  // Load product data for edit mode
  useEffect(() => {
    if (isEdit && productData) {
      const product = (productData as { product: Product }).product;
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || 0,
        category: product.category || '',
        brand: product.brand || '',
        stock: product.stock || 0,
        images: product.images || [product.image || ''],
        specifications: Array.isArray(product.specifications) 
          ? product.specifications 
          : Object.entries(product.specifications || {}).map(([key, value]) => ({ key, value: String(value) })) || [{ key: '', value: '' }],
        tags: product.tags || [],
        isActive: product.isActive !== false,
        isFeatured: product.isFeatured || false,
        seo: {
          title: product.name || '',
          description: product.description || '',
          keywords: product.tags?.join(', ') || '',
        },
      });
    }
  }, [isEdit, productData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('seo.')) {
      const seoField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        seo: {
          ...prev.seo,
          [seoField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || 0 : value
      }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSpecificationChange = (index: number, field: 'key' | 'value', value: string) => {
    const newSpecs = [...formData.specifications];
    newSpecs[index][field] = value;
    setFormData(prev => ({ ...prev, specifications: newSpecs }));
  };

  const addSpecification = () => {
    setFormData(prev => ({
      ...prev,
      specifications: [...prev.specifications, { key: '', value: '' }]
    }));
  };

  const removeSpecification = (index: number) => {
    if (formData.specifications.length > 1) {
      const newSpecs = formData.specifications.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, specifications: newSpecs }));
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleImageAdd = () => {
    // In a real app, this would open a file picker or image upload dialog
    const imageUrl = prompt('Nhập URL hình ảnh:');
    if (imageUrl) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageUrl]
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Tên sản phẩm là bắt buộc';
    if (!formData.description.trim()) newErrors.description = 'Mô tả là bắt buộc';
    if (formData.price <= 0) newErrors.price = 'Giá phải lớn hơn 0';
    if (!formData.category) newErrors.category = 'Danh mục là bắt buộc';
    if (!formData.brand) newErrors.brand = 'Thương hiệu là bắt buộc';
    if (formData.stock < 0) newErrors.stock = 'Số lượng không được âm';
    if (formData.images.length === 0) newErrors.images = 'Cần ít nhất 1 hình ảnh';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const productPayload = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        category: formData.category,
        brand: formData.brand,
        stock: formData.stock,
        image: formData.images[0] || '',
        images: formData.images,
        specifications: formData.specifications
          .filter(spec => spec.key && spec.value)
          .reduce((acc, spec) => {
            acc[spec.key] = spec.value;
            return acc;
          }, {} as Record<string, string>),
        tags: formData.tags,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        rating: 0,
        reviews: 0,
      };

      if (isEdit && productId) {
        await updateProduct({ id: productId, data: productPayload });
        alert('Sản phẩm đã được cập nhật!');
      } else {
        await createProduct(productPayload);
        alert('Sản phẩm đã được thêm!');
        // Reset form
        setFormData({
          name: '',
          description: '',
          price: 0,
          category: '',
          brand: '',
          stock: 0,
          images: [],
          specifications: [{ key: '', value: '' }],
          tags: [],
          isActive: true,
          isFeatured: false,
          seo: {
            title: '',
            description: '',
            keywords: ''          }
        });
      }
      
      // Redirect back to products list
      router.push('/admin/products');
      
    } catch (error: any) {
      console.error('Error saving product:', error);
      alert('Có lỗi xảy ra: ' + (error.message || 'Vui lòng thử lại'));
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Thông tin cơ bản
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tên sản phẩm *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Nhập tên sản phẩm"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Giá (VNĐ) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  errors.price ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="0"
              />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Danh mục *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  errors.category ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">Chọn danh mục</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Thương hiệu *
              </label>
              <select
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  errors.brand ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">Chọn thương hiệu</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
              {errors.brand && <p className="text-red-500 text-xs mt-1">{errors.brand}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Số lượng *
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  errors.stock ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="0"
              />
              {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mô tả *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Nhập mô tả sản phẩm"
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>
        </div>

        {/* Images */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Hình ảnh *
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {formData.images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image}
                  alt={`Product ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            
            <button
              type="button"
              onClick={handleImageAdd}
              className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
              <div className="text-center">
                <Upload className="h-8 w-8 mx-auto mb-2" />
                <span className="text-sm">Thêm ảnh</span>
              </div>
            </button>
          </div>
          
          {errors.images && <p className="text-red-500 text-xs mt-2">{errors.images}</p>}
        </div>

        {/* Specifications */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Thông số kỹ thuật
          </h2>
          
          <div className="space-y-3">
            {formData.specifications.map((spec, index) => (
              <div key={index} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Tên thông số"
                  value={spec.key}
                  onChange={(e) => handleSpecificationChange(index, 'key', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Giá trị"
                  value={spec.value}
                  onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => removeSpecification(index)}
                  className="px-3 py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Minus className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          
          <button
            type="button"
            onClick={addSpecification}
            className="mt-3 flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <Plus className="h-4 w-4 mr-1" />
            Thêm thông số
          </button>
        </div>

        {/* Tags */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Tags
          </h2>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nhập tag mới"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Thêm
            </button>
          </div>
        </div>

        {/* SEO */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            SEO
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                SEO Title
              </label>
              <input
                type="text"
                name="seo.title"
                value={formData.seo.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Tiêu đề SEO"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                SEO Description
              </label>
              <textarea
                name="seo.description"
                value={formData.seo.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Mô tả SEO"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Keywords
              </label>
              <input
                type="text"
                name="seo.keywords"
                value={formData.seo.keywords}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="từ khóa, seo, tối ưu"
              />
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Cài đặt
          </h2>
          
          <div className="flex flex-col space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleCheckboxChange}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Sản phẩm hoạt động
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleCheckboxChange}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Sản phẩm nổi bật
              </span>
            </label>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Hủy
          </button>          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
          >
            {isLoading ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Thêm sản phẩm')}
          </button>
        </div>
      </form>
    </div>
  );
}
