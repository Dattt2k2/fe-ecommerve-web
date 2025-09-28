import ProductCard from '@/components/product/ProductCard';

export default async function Home() {
  let featured: import('@/types').Product[] = [];
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/products/get`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      // Expecting either an array or a wrapper like { products: [...] }
      console.debug('Products API response (raw):', data);
      if (Array.isArray(data)) {
        featured = data;
      } else if (Array.isArray(data.products)) {
        featured = data.products;
      } else if (Array.isArray(data.data?.products)) {
        featured = data.data.products;
      } else if (Array.isArray(data.items)) {
        featured = data.items;
      } else {
        // fallback: if it's an object with numeric keys, convert to array
        if (data && typeof data === 'object') {
          const vals = Object.values(data).filter(v => Array.isArray(v)).shift();
          if (Array.isArray(vals)) featured = vals as import('@/types').Product[];
        }
      }
    } else {
      console.error('Failed to fetch products:', res.status);
    }
  } catch (err) {
    console.error('Error fetching products on server:', err);
  }

  return (
    <div>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-gray-100">Sản phẩm nổi bật</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {featured.map((p: import('@/types').Product) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
