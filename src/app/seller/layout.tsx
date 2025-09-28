import React from 'react'
import SellerDashboard from '@/components/seller/SellerDashboard'

export const metadata = {
  title: 'Kênh Người Bán - Quản lý',
}

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <SellerDashboard>{children}</SellerDashboard>
      </body>
    </html>
  )
}
