import { Metadata } from 'next';
import AdminDashboard from '@/components/admin/AdminDashboard';

export const metadata: Metadata = {
  title: 'Admin Dashboard - Ecommo',
  description: 'Quản lý cửa hàng trực tuyến',
};

export default function AdminPage() {
  return <AdminDashboard />;
}
