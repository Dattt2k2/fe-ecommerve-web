import { NextRequest, NextResponse } from 'next/server';
import { Product } from '@/types';

// Mock products database
const products: Product[] = [  {
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

// GET /api/products - Get all products with optional filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');

    let filteredProducts = [...products];

    // Filter by category
    if (category) {
      filteredProducts = filteredProducts.filter(product => 
        product.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by search term
    if (search) {
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    return NextResponse.json({
      products: paginatedProducts,
      pagination: {
        page,
        limit,
        total: filteredProducts.length,
        totalPages: Math.ceil(filteredProducts.length / limit)
      }
    });
  } catch (error) {
    console.error('Error in products API:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy danh sách sản phẩm' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create new product (admin only)
export async function POST(request: NextRequest) {
  try {
    const productData = await request.json();

    // Validate required fields
    if (!productData.name || !productData.price || !productData.category) {
      return NextResponse.json(
        { error: 'Tên, giá và danh mục sản phẩm là bắt buộc' },
        { status: 400 }
      );
    }    // Create new product
    const newProduct: Product = {
      id: (products.length + 1).toString(),
      name: productData.name,
      description: productData.description || '',
      price: productData.price,
      originalPrice: productData.originalPrice || productData.price,
      category: productData.category,
      image: productData.image || '/api/placeholder/300/300',
      stock: productData.stock || 0,
      images: productData.images || ['/api/placeholder/300/300'],
      rating: 0,
      reviews: 0,
      tags: productData.tags || []
    };

    products.push(newProduct);

    return NextResponse.json({
      message: 'Tạo sản phẩm thành công',
      product: newProduct
    }, { status: 201 });
  } catch (error) {
    console.error('Error in create product API:', error);
    return NextResponse.json(
      { error: 'Lỗi khi tạo sản phẩm' },
      { status: 500 }
    );
  }
}
