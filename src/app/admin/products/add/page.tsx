import { Metadata } from 'next';
import ProductForm from '@/components/admin/ProductForm';

export const metadata: Metadata = {
  title: 'Thêm sản phẩm - Admin',
  description: 'Thêm sản phẩm mới vào cửa hàng',
};

export default function AddProductPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Thêm sản phẩm mới
      </h1>
      <ProductForm />
    </div>
  );
}
