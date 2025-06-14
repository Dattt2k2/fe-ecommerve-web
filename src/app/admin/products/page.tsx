import { Metadata } from 'next';
import ProductManagement from '@/components/admin/ProductManagement';

export const metadata: Metadata = {
  title: 'Quản lý sản phẩm - Admin',
  description: 'Quản lý sản phẩm cửa hàng',
};

export default function AdminProductsPage() {
  return <ProductManagement />;
}
