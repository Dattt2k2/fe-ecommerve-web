import { Metadata } from 'next';
import ProductForm from '@/components/admin/ProductForm';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Chỉnh sửa sản phẩm - Admin',
  description: 'Chỉnh sửa thông tin sản phẩm',
};

interface EditProductPageProps {
  params: {
    id: string;
  };
}

export default function EditProductPage({ params }: EditProductPageProps) {
  // In a real app, you would fetch the product data here
  // For now, we'll use mock data
  const productId = params.id;
  
  if (!productId) {
    notFound();
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Chỉnh sửa sản phẩm #{productId}
      </h1>
      <ProductForm productId={productId} />
    </div>
  );
}
