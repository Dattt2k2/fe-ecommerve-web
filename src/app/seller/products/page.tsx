import Link from 'next/link'

type Product = {
  id: string
  title: string
  price: number
  stock?: number
  thumbnail?: string
}

async function fetchSellerProducts(): Promise<Product[]> {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
  const url = `${base}/api/seller/products`

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`Failed to fetch products: ${res.status}`)
  }

  const data = await res.json()
  
  // Expecting data to be an array; backend shape may vary
  let products: Product[] = [];
  if (Array.isArray(data)) products = data as Product[];
  else if (Array.isArray(data.data)) products = data.data as Product[];
  
  return products;
}

export default async function SellerProducts() {
  let products: Product[] = []
  let error: string | null = null

  try {
    products = await fetchSellerProducts()
  } catch (err: any) {
    error = err?.message || 'Lỗi khi tải sản phẩm'
  }

  return (
    <div className="text-white">
      <div className="mb-2">
        <h2 className="text-2xl font-semibold text-white">Kho hàng</h2>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-800 p-4 rounded mb-4">{error}</div>
      ) : (
        <>
          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <div key={p.id} className="bg-white/5 border border-white/10 rounded p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-800 rounded overflow-hidden flex items-center justify-center">
                      {p.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.thumbnail} alt={p.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-sm text-gray-400">No image</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{p.title}</h3>
                      <p className="text-sm text-gray-300">{p.stock ?? 0} trong kho</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-white">{p.price.toLocaleString()}₫</div>
                      {p.id ? (
                        <Link href={`/seller/products/${p.id}`} className="text-sm text-orange-300">Sửa</Link>
                      ) : (
                        <span className="text-sm text-gray-500">Chưa có ID</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-white/5 rounded shadow text-gray-300">
              Chưa có sản phẩm. <Link href="/seller/products/new" className="text-orange-400 underline">Tạo sản phẩm mới</Link> hoặc <Link href="/seller/inventory/new" className="text-orange-400 underline">thêm hàng</Link>.
            </div>
          )}
        </>
      )}
    </div>
  )
}

