// Mock data cho E-commerce App
import { Product, Category } from '@/types';

export const categories: Category[] = [
  {
    id: '1',
    name: 'Thời trang nam',
    slug: 'thoi-trang-nam',
    description: 'Quần áo và phụ kiện dành cho nam giới',
    image: '👕',
  },
  {
    id: '2',
    name: 'Thời trang nữ',
    slug: 'thoi-trang-nu',
    description: 'Quần áo và phụ kiện dành cho nữ giới',
    image: '👗',
  },
  {
    id: '3',
    name: 'Điện tử',
    slug: 'dien-tu',
    description: 'Điện thoại, laptop, thiết bị điện tử',
    image: '📱',
  },
  {
    id: '4',
    name: 'Gia dụng',
    slug: 'gia-dung',
    description: 'Đồ gia dụng và nội thất',
    image: '🏠',
  },
];

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro Max',
    description: 'Điện thoại thông minh cao cấp với chip A17 Pro mạnh mẽ',
    price: 29990000,
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop',
    stock: 50,
    rating: 4.8,
    reviews: 125,
    featured: true,
    tags: ['smartphone', 'apple', 'premium']
  },
  {
    id: '2',
    name: 'MacBook Pro 14"',
    description: 'Laptop chuyên nghiệp với chip M3 Pro',
    price: 52990000,
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=400&fit=crop',
    stock: 25,
    rating: 4.9,
    reviews: 89,
    featured: true,
    tags: ['laptop', 'apple', 'professional']
  },
  {
    id: '3',
    name: 'AirPods Pro 2',
    description: 'Tai nghe không dây với chống ồn chủ động',
    price: 6490000,
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&h=400&fit=crop',
    stock: 100,
    rating: 4.7,
    reviews: 234,
    tags: ['earphones', 'apple', 'wireless']
  },
  {
    id: '4',
    name: 'Nike Air Max 270',
    description: 'Giày thể thao nam với đệm khí tối ưu',
    price: 2899000,
    category: 'fashion',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
    stock: 75,
    rating: 4.5,
    reviews: 156,
    tags: ['shoes', 'nike', 'sports']
  },
  {
    id: '5',
    name: 'Samsung 4K Smart TV 55"',
    description: 'Smart TV 55 inch với độ phân giải 4K',
    price: 15990000,
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop',
    stock: 30,
    rating: 4.6,
    reviews: 78,
    tags: ['tv', 'samsung', '4k']
  },
  {
    id: '6',
    name: 'Áo Polo Nam',
    description: 'Áo polo nam cao cấp chất liệu cotton',
    price: 599000,
    category: 'fashion',
    image: 'https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?w=400&h=400&fit=crop',
    stock: 120,
    rating: 4.3,
    reviews: 67,
    tags: ['clothing', 'polo', 'men']
  },
];

// Helper functions
export async function getFeaturedProducts(): Promise<Product[]> {
  return mockProducts.filter(product => product.featured);
}

export async function getAllProducts(): Promise<Product[]> {
  return mockProducts;
}

export async function getProductById(id: string): Promise<Product | undefined> {
  return mockProducts.find(product => product.id === id);
}

export async function getCategories(): Promise<Category[]> {
  return categories;
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  return mockProducts.filter(product => product.category === category);
}
