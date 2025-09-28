"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Item = { id: string; name: string; qty: number }

export default function SellerInventoryClient() {
  const [items, setItems] = useState<Item[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true)
      setError(null)
      try {
        const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
        const res = await fetch(`${base}/api/seller/products/user`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const list = Array.isArray(data) ? data : data?.data ?? []
        setItems(list)
      } catch (err: any) {
        setError(err?.message || 'Lỗi khi tải dữ liệu')
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Kho hàng</h2>
        <Link href="/seller/inventory/new" className="px-4 py-2 bg-orange-500 text-white rounded">Thêm hàng</Link>
      </div>

      {loading && <div className="text-gray-300">Đang tải...</div>}
      {error && <div className="text-red-400">{error}</div>}

      {!loading && items && (
        <div className="bg-white/5 rounded shadow">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b">
                <th className="p-3">Mã</th>
                <th className="p-3">Tên</th>
                <th className="p-3">Số lượng</th>
                <th className="p-3">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-b">
                  <td className="p-3 font-medium text-white">{it.id}</td>
                  <td className="p-3 text-gray-200">{it.name}</td>
                  <td className="p-3 text-gray-200">{it.qty}</td>
                  <td className="p-3"><Link href={`/seller/inventory/${it.id}`} className="text-orange-300">Sửa</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

