import { Metadata } from 'next';
import OrderManagement from '@/components/admin/OrderManagement';

export const metadata: Metadata = {
  title: 'Quản lý đơn hàng - Admin',
  description: 'Quản lý đơn hàng cửa hàng',
};

export default function AdminOrdersPage() {
  return <OrderManagement />;
}
