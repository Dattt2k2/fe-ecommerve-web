import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export function middleware(request: NextRequest) {
  console.log(`[Middleware] ${request.method} ${request.nextUrl.pathname}`);
  
  // Get the token from cookies
  const token = request.cookies.get('auth-token')?.value;
  
  // Check if this is an admin route
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  
  // Check if this is a seller route
  const isSellerRoute = request.nextUrl.pathname.startsWith('/seller');
  
  // Public API endpoints that don't require authentication
  const isPublicApiRoute = request.nextUrl.pathname.match(/^\/api\/products\/[^/]+$/) && request.method === 'GET';
  const isPublicProductsRoute = request.nextUrl.pathname.startsWith('/api/products') && request.method === 'GET';
  const isUploadRoute = request.nextUrl.pathname.startsWith('/api/upload');
  const isPublicProxyRoute = request.nextUrl.pathname.match(/^\/api\/proxy\/products\/[^/]+$/) && request.method === 'GET';
  const isPublicProxyReviewsRoute = request.nextUrl.pathname.match(/^\/api\/proxy\/products\/[^/]+\/reviews$/) && request.method === 'GET';
  console.log(`[Middleware] isPublicApiRoute: ${isPublicApiRoute}`);
  console.log(`[Middleware] isPublicProductsRoute: ${isPublicProductsRoute}`);
  console.log(`[Middleware] isPublicProxyRoute: ${isPublicProxyRoute}`);
  console.log(`[Middleware] isPublicProxyReviewsRoute: ${isPublicProxyReviewsRoute}`);
  
  // Handle CORS for API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    // Handle preflight OPTIONS request specifically
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*', 
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With',
          'Access-Control-Max-Age': '86400', // 24 hours
          'Access-Control-Allow-Credentials': 'true'
        }
      });
    }
    
    // Allow public API routes without auth checks
    if (isPublicApiRoute || isPublicProductsRoute || isUploadRoute || isPublicProxyRoute || isPublicProxyReviewsRoute) {
      console.log(`[Middleware] Allowing public API route: ${request.nextUrl.pathname}`);
      const response = NextResponse.next();
      
      // Add CORS headers for API routes
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      
      return response;
    }
    
    // For other API routes, add CORS headers but continue with normal processing
    const response = NextResponse.next();
    
    // Add CORS headers for API routes
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    return response;
  }
  
  // If accessing admin routes
  if (isAdminRoute) {
    // If no token, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    try {
      // Verify the token
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
      
      // Get role from user_type (backend field) or role field
      const userType = payload.user_type || payload.role;
      
      // Normalize role to lowercase for comparison
      const userRole = userType?.toLowerCase();
      
      // Redirect admin and seller to seller page instead of admin page
      if (userRole === 'admin' || userRole === 'seller') {
        return NextResponse.redirect(new URL('/seller', request.url));
      }
      
      // If user doesn't have admin or seller role, redirect to home
      return NextResponse.redirect(new URL('/', request.url));
    } catch (error) {
      // Invalid token, redirect to login
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }
  
  // If accessing seller routes
  if (isSellerRoute) {
    console.log(`[Middleware] Seller route detected: ${request.nextUrl.pathname}`);
    console.log(`[Middleware] Has token: ${!!token}`);
    
    // If no token, redirect to login
    if (!token) {
      console.log(`[Middleware] No token found, redirecting to login`);
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    try {
      // Verify the token
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
      
      // Get role from user_type (backend field) or role field
      const userType = payload.user_type || payload.role;
      console.log(`[Middleware] Token verified, user_type: ${userType}, role: ${payload.role}`);
      
      // Normalize role to lowercase for comparison
      const userRole = userType?.toLowerCase();
      
      // Check if user has seller or admin role (admin can also access seller routes)
      if (userRole !== 'seller' && userRole !== 'admin') {
        console.log(`[Middleware] User role ${userType} (normalized: ${userRole}) is not authorized for seller routes, redirecting to home`);
        return NextResponse.redirect(new URL('/', request.url));
      }
      
      console.log(`[Middleware] User authorized for seller route`);
    } catch (error) {
      // Invalid token, redirect to login
      console.log(`[Middleware] Token verification failed:`, error);
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }
  
  // Check if accessing home page or user-only routes (profile, orders, cart, etc.)
  const isHomePage = request.nextUrl.pathname === '/' || request.nextUrl.pathname === '';
  const isUserOnlyRoute = 
    request.nextUrl.pathname.startsWith('/profile') ||
    request.nextUrl.pathname.startsWith('/orders') ||
    request.nextUrl.pathname.startsWith('/cart') ||
    request.nextUrl.pathname.startsWith('/checkout') ||
    request.nextUrl.pathname.startsWith('/payment') ||
    request.nextUrl.pathname.startsWith('/my-orders') ||
    request.nextUrl.pathname.startsWith('/products');
  
  // Block admin/seller from accessing home page and user-only routes
  if ((isHomePage || isUserOnlyRoute) && token) {
    try {
      // Verify the token
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
      
      // Get role from user_type (backend field) or role field
      const userType = payload.user_type || payload.role;
      const userRole = userType?.toLowerCase();
      
      // If user is admin or seller, redirect to seller page
      if (userRole === 'admin' || userRole === 'seller') {
        console.log(`[Middleware] Admin/Seller (${userRole}) trying to access ${isHomePage ? 'home page' : 'user route'}, redirecting to /seller`);
        return NextResponse.redirect(new URL('/seller', request.url));
      }
    } catch (error) {
      // Invalid token, continue normally (will be handled by page-level auth)
      console.log(`[Middleware] Token verification failed for user route:`, error);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/admin/:path*',
    '/seller/:path*',
    '/profile/:path*',
    '/orders/:path*',
    '/my-orders/:path*',
    '/cart/:path*',
    '/checkout/:path*',
    '/payment/:path*',
    '/products/:path*',
    '/api/admin/:path*',
    '/api/user/:path*', 
    '/api/seller/:path*',
    '/api/cart/:path*',
    '/api/auth/:path*',
    '/payments/:path*',
  ]
};
