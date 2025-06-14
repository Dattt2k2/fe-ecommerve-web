import { Metadata } from 'next';
import CustomerManagement from '@/components/admin/CustomerManagement';

export const metadata: Metadata = {
  title: 'Quản lý khách hàng - Admin',
  description: 'Quản lý thông tin khách hàng',
};

export default function CustomersPage() {
  return <CustomerManagement />;
}
