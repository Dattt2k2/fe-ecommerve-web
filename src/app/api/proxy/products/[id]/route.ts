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
    
    // Map dữ liệu từ backend về format chuẩn
    const mappedData = {
      id: data.id,
      name: data.name,
      description: data.description,
      price: data.price,
      category: data.category,
      images: data.image_path || [],
      image: Array.isArray(data.image_path) && data.image_path.length > 0 
        ? data.image_path[0] 
        : '/images/placeholder.jpg',
      stock: data.quantity || 0,
      rating: data.rating || 0,
      reviews: data.rating_count || 0,
      sold: data.sold_count || 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
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
