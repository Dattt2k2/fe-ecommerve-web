import { Metadata } from 'next';
import ProductDetail from '@/components/admin/ProductDetail';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Chi tiết sản phẩm - Admin',
  description: 'Xem chi tiết sản phẩm',
};

interface ProductDetailPageProps {
  params?: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const resolvedParams = await params;
  const productId = resolvedParams?.id;
  
  if (!productId) {
    notFound();
  }

  return <ProductDetail productId={productId} />;
}
