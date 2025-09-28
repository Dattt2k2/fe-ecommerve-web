import Link from 'next/link'

export default function SellerHome() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Trang quản lý</h2>
        <div className="space-x-2">
          <Link href="/seller/inventory" className="px-4 py-2 bg-orange-500 text-white rounded">Kho hàng</Link>
          <Link href="/seller/orders" className="px-4 py-2 bg-gray-200 rounded">Đơn hàng</Link>
        </div>
      </div>
    </div>
  )
}
