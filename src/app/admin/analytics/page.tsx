import { Metadata } from 'next';
import AnalyticsManagement from '@/components/admin/AnalyticsManagement';

export const metadata: Metadata = {
  title: 'Phân tích thống kê - Admin',
  description: 'Phân tích dữ liệu bán hàng và khách hàng',
};

export default function AnalyticsPage() {
  return <AnalyticsManagement />;
}
