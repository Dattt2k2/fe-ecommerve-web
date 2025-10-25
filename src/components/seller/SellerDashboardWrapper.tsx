"use client";

import dynamic from 'next/dynamic';

const SellerDashboard = dynamic(() => import('./SellerDashboard'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

export default function SellerDashboardWrapper({ children }: { children: React.ReactNode }) {
  return <SellerDashboard>{children}</SellerDashboard>;
}