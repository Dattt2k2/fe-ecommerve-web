import ProductCard from '@/components/product/ProductCard';

export default async function Home() {
  let featured: import('@/types').Product[] = [];
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/products/get`, { 
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
    
    
    if (res.ok) {
      const data = await res.json();
      
      // Backend returns: { data: [...], cached: false, page: 1, etc }
      let rawProducts: any[] = [];
      if (Array.isArray(data.data)) {
        rawProducts = data.data; // Main path for /api/products/get
      } else if (Array.isArray(data)) {
        rawProducts = data;
      } else if (Array.isArray(data.products)) {
        rawProducts = data.products;
      } else if (Array.isArray(data.items)) {
        rawProducts = data.items;
      } else {
        // fallback: if it's an object with numeric keys, convert to array
        if (data && typeof data === 'object') {
          const vals = Object.values(data).filter(v => Array.isArray(v)).shift();
          if (Array.isArray(vals)) rawProducts = vals as any[];
        }
      }
      
      // Map and validate image URLs
      featured = rawProducts.map((item: any) => {
        const getValidImageUrl = (imagePath: any): string => {
          if (!imagePath) return '/images/placeholder.jpg';
          
          if (Array.isArray(imagePath)) {
            const validUrl = imagePath.find((url: any) => {
              if (typeof url !== 'string' || !url) return false;
              return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
            });
            return validUrl || '/images/placeholder.jpg';
          }
          
          if (typeof imagePath === 'string' && imagePath) {
            if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('/')) {
              return imagePath;
            }
          }
          
          return '/images/placeholder.jpg';
        };
        
        return {
          ...item,
          image: getValidImageUrl(item.image_path || item.image),
          images: Array.isArray(item.image_path) 
            ? item.image_path.filter((url: any) => typeof url === 'string' && url)
            : [],
        };
      });
    } else {
    }
  } catch (err) {
  }

  return (
    <div>

      {/* Featured Products */}
      <section className="py-8 sm:py-12 lg:py-16 bg-gradient-to-b from-gray-50 to-gray-900 dark:from-gray-800 dark:to-black">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 lg:mb-12 text-gray-900 dark:text-gray-100">
              Sản phẩm nổi bật
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {featured.map((p: import('@/types').Product) => (
              <ProductCard key={p.id} product={p} />
            ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
