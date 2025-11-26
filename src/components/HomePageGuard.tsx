'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function HomePageGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) {
      return;
    }

    // If user is authenticated and is admin or seller, redirect to seller
    if (isAuthenticated && user) {
      const userRole = user.role?.toLowerCase();
      if (userRole === 'admin' || userRole === 'seller') {
        console.log('[HomePageGuard] Admin/Seller detected, redirecting to /seller');
        router.replace('/seller');
        return;
      }
    }
  }, [user, loading, isAuthenticated, router]);

  // Show loading while checking
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // If user is admin/seller, don't render (redirect will happen)
  if (isAuthenticated && user) {
    const userRole = user.role?.toLowerCase();
    if (userRole === 'admin' || userRole === 'seller') {
      return null;
    }
  }

  return <>{children}</>;
}

