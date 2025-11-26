"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';

const SellerDashboard = dynamic(() => import('./SellerDashboard'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

export default function SellerDashboardWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) {
      console.log('[SellerDashboardWrapper] Still loading auth...');
      return;
    }

    console.log('[SellerDashboardWrapper] Auth check:', { 
      isAuthenticated, 
      hasUser: !!user, 
      userRole: user?.role 
    });

    // If not authenticated, redirect to login
    if (!isAuthenticated || !user) {
      console.log('[SellerDashboardWrapper] Not authenticated, redirecting to login');
      router.push('/auth/login');
      return;
    }

    // Normalize role to lowercase for comparison
    const userRole = user.role?.toLowerCase();
    
    // Check if user has seller or admin role
    if (userRole !== 'seller' && userRole !== 'admin') {
      // User doesn't have permission, redirect to home
      console.log(`[SellerDashboardWrapper] User role ${user.role} (normalized: ${userRole}) is not authorized, redirecting to home`);
      router.push('/');
      return;
    }

    console.log('[SellerDashboardWrapper] User authorized, rendering dashboard');
  }, [user, loading, isAuthenticated, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  // If not authenticated or wrong role, don't render (redirect will happen)
  const userRole = user?.role?.toLowerCase();
  if (!isAuthenticated || !user || (userRole !== 'seller' && userRole !== 'admin')) {
    return null;
  }

  return <SellerDashboard>{children}</SellerDashboard>;
}