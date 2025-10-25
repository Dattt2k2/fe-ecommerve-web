import React from 'react'
import SellerDashboardWrapper from '@/components/seller/SellerDashboardWrapper'

export const metadata = {
  title: 'Kênh Người Bán - Quản lý',
}

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SellerDashboardWrapper>{children}</SellerDashboardWrapper>
    </>
  )
}
