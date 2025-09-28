import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export function middleware(request: NextRequest) {
  // Get the token from cookies
  const token = request.cookies.get('auth-token')?.value;
  
  // Check if this is an admin route
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  
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
    '/profile/:path*'
  ]
};
