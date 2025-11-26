'use client';

import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { useCategoryList, useCreateCategory, useDeleteCategory } from '@/hooks/useApi';

interface CategoryManagementProps {
  onCategoriesChange?: () => void;
}

export default function CategoryManagement({ onCategoriesChange }: CategoryManagementProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);

  const { data: categories, loading, error: fetchError, refetch } = useCategoryList();
  const { mutate: createCategory, loading: createLoading } = useCreateCategory();
  const { mutate: deleteCategory, loading: deleteLoading } = useDeleteCategory();

  // Handle API response - getCategoryList now extracts data, but keep fallback for safety
  let categoryList: any[] = [];
  if (Array.isArray(categories)) {
    categoryList = categories;
  } else if (categories && typeof categories === 'object') {
    // Fallback: API might return { data: [...] } if extraction didn't happen
    if ('data' in categories && Array.isArray(categories.data)) {
      categoryList = categories.data;
    } else if ('categories' in categories && Array.isArray(categories.categories)) {
      categoryList = categories.categories;
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setError('Vui lòng nhập tên danh mục');
      return;
    }

    try {
      setError(null);
      await createCategory(newCategoryName.trim());
      setNewCategoryName('');
      setShowAddModal(false);
      refetch();
      onCategoriesChange?.();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi thêm danh mục');
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setCategoryToDelete({ id, name });
    setShowDeleteModal(true);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setCategoryToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteCategory(categoryToDelete.id);
      refetch();
      onCategoriesChange?.();
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    } catch (err: any) {
      alert('Có lỗi xảy ra khi xóa danh mục: ' + (err.message || 'Unknown error'));
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quản lý Danh mục
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Thêm, xóa danh mục sản phẩm
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Thêm danh mục
        </button>
      </div>

      {fetchError && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-400">
            Lỗi: {fetchError}
          </p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      ) : categoryList.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Chưa có danh mục nào. Hãy thêm danh mục đầu tiên!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryList.map((category: any, index: number) => {
            // Handle different category formats
            const categoryId = category.id || category.category_id || category._id || `category-${index}`;
            const categoryName = category.name || category.category_name || category.title || String(category) || 'Unnamed Category';
            
            return (
              <div
                key={categoryId}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <span className="text-gray-900 dark:text-white font-medium">
                  {categoryName}
                </span>
                <button
                  onClick={() => handleDeleteClick(categoryId, categoryName)}
                  disabled={deleteLoading}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                  title="Xóa danh mục"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Thêm danh mục mới
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewCategoryName('');
                  setError(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tên danh mục *
              </label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => {
                  setNewCategoryName(e.target.value);
                  setError(null);
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCategory();
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Nhập tên danh mục"
                autoFocus
              />
              {error && (
                <p className="text-red-500 text-xs mt-1">{error}</p>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewCategoryName('');
                  setError(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleAddCategory}
                disabled={createLoading || !newCategoryName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createLoading ? 'Đang thêm...' : 'Thêm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && categoryToDelete && (
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
              Bạn có chắc chắn muốn xóa danh mục <strong>"{categoryToDelete.name}"</strong>? 
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

