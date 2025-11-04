import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export function middleware(request: NextRequest) {
  console.log(`[Middleware] ${request.method} ${request.nextUrl.pathname}`);
  
  // Get the token from cookies
  const token = request.cookies.get('auth-token')?.value;
  
  // Check if this is an admin route
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  
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
      
      // Check if user has admin role
      if (payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (error) {
      // Invalid token, redirect to login
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/profile/:path*',
    '/api/admin/:path*',
    '/api/user/:path*', 
    '/api/seller/:path*',
    '/orders/:path*',
    '/api/cart/:path*',
    '/api/auth/:path*',
    '/orders/:path*',
    '/payments/:path*',
  ]
};
