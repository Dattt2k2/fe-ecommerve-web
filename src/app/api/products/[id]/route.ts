import { NextRequest, NextResponse } from 'next/server';
import { Product } from '@/types';

// Mock products database - same as in the main route
let products: Product[] = [
  {
    id: '1',
    name: 'iPhone 14 Pro',
    description: 'Apple iPhone 14 Pro với camera 48MP, chip A16 Bionic',
    price: 29990000,
    originalPrice: 32990000,
    category: 'smartphones',
    image: '/api/placeholder/300/300',
    stock: 10,
    images: ['/api/placeholder/300/300'],
    rating: 4.8,
    reviews: 120,
    tags: ['hot', 'sale']
  },
  {
    id: '2',
    name: 'Samsung Galaxy S23',
    description: 'Samsung Galaxy S23 với camera 50MP, chip Snapdragon 8 Gen 2',
    price: 19990000,
    originalPrice: 22990000,
    category: 'smartphones',
    image: '/api/placeholder/300/300',
    stock: 15,
    images: ['/api/placeholder/300/300'],
    rating: 4.7,
    reviews: 89,
    tags: ['new']
  },
  {
    id: '3',
    name: 'MacBook Air M2',
    description: 'MacBook Air với chip M2, 13.6 inch, 8GB RAM, 256GB SSD',
    price: 28990000,
    originalPrice: 31990000,
    category: 'laptops',
    image: '/api/placeholder/300/300',
    stock: 8,
    images: ['/api/placeholder/300/300'],
    rating: 4.9,
    reviews: 45,
    tags: ['hot']
  },
  {
    id: '4',
    name: 'AirPods Pro 2',
    description: 'Apple AirPods Pro thế hệ 2 với chip H2, chống ồn chủ động',
    price: 6490000,
    originalPrice: 7490000,
    category: 'audio',
    image: '/api/placeholder/300/300',
    stock: 25,
    images: ['/api/placeholder/300/300'],
    rating: 4.6,
    reviews: 78,
    tags: ['sale']
  },
  {
    id: '5',
    name: 'iPad Pro 11',
    description: 'iPad Pro 11 inch với chip M2, 128GB, Wi-Fi',
    price: 21990000,
    originalPrice: 23990000,
    category: 'tablets',
    image: '/api/placeholder/300/300',
    stock: 12,
    images: ['/api/placeholder/300/300'],
    rating: 4.8,
    reviews: 67,
    tags: ['new']
  }
];

// GET /api/products/[id] - Get product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const product = products.find(p => p.id === id);
    if (!product) {
      return NextResponse.json(
        { error: 'Không tìm thấy sản phẩm' },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error in get product API:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy thông tin sản phẩm' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update product (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const productData = await request.json();

    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) {
      return NextResponse.json(
        { error: 'Không tìm thấy sản phẩm' },
        { status: 404 }
      );
    }

    // Update product
    const updatedProduct: Product = {
      ...products[productIndex],
      ...productData,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };

    products[productIndex] = updatedProduct;

    return NextResponse.json({
      message: 'Cập nhật sản phẩm thành công',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error in update product API:', error);
    return NextResponse.json(
      { error: 'Lỗi khi cập nhật sản phẩm' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete product (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) {
      return NextResponse.json(
        { error: 'Không tìm thấy sản phẩm' },
        { status: 404 }
      );
    }

    // Remove product
    products.splice(productIndex, 1);

    return NextResponse.json({
      message: 'Xóa sản phẩm thành công'
    });
  } catch (error) {
    console.error('Error in delete product API:', error);
    return NextResponse.json(
      { error: 'Lỗi khi xóa sản phẩm' },
      { status: 500 }
    );
  }
}
