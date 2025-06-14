import { Metadata } from 'next';
import AdminSettings from '@/components/admin/AdminSettings';

export const metadata: Metadata = {
  title: 'Cài đặt - Admin',
  description: 'Cài đặt hệ thống quản trị',
};

export default function SettingsPage() {
  return <AdminSettings />;
}
