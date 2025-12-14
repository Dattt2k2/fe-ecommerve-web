import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    console.log(`[Proxy] Fetching product: ${id}`);
    
    // Gọi API backend thông qua proxy
    const response = await fetch(`http://api.example.com/products/get/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Không cache để luôn lấy dữ liệu mới nhất
    });

    if (!response.ok) {
      console.error(`[Proxy] Failed to fetch product: ${response.status}`);
      return NextResponse.json(
        { error: 'Failed to fetch product', status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[Proxy] Product fetched successfully:`, data.name);
    
    // Compute price and stock from variants if available
    let price = data.price || 0;
    let stock = data.quantity || 0;
    
    if (data.variants && Array.isArray(data.variants) && data.variants.length > 0) {
      price = Math.min(...data.variants.map((v: any) => v.price || 0));
      stock = data.variants.reduce((sum: number, v: any) => sum + (v.quantity || 0), 0);
    }
    
    // Map dữ liệu từ backend về format chuẩn
    const mappedData = {
      id: data.id,
      name: data.name,
      description: data.description,
      price: price,
      category: data.category,
      images: data.image_path || [],
      image: Array.isArray(data.image_path) && data.image_path.length > 0 
        ? data.image_path[0] 
        : '/images/placeholder.jpg',
      stock: stock,
      rating: data.rating || 0,
      reviews: data.rating_count || 0,
      sold: data.sold_count || 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      variants: data.variants || [], // Include variants
    };
    
    return NextResponse.json(mappedData);
  } catch (error) {
    console.error('[Proxy] Error fetching product:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
