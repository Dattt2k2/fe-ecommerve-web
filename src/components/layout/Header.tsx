// src/components/layout/Header.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User as UserType } from '@/types';
import Link from 'next/link';
import { ShoppingCart, User as UserIcon, Search, Menu, X } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useCart } from '@/context/CartContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { itemCount } = useCart();
  const { user, logout, isAuthenticated } = useAuth();

  // Fallback: read user from localStorage if auth context hasn't hydrated yet
  const [localUser, setLocalUser] = useState<UserType | null>(null);
  useEffect(() => {
    try {
      const u = localStorage.getItem('user');
      if (u) {
        setLocalUser(JSON.parse(u));
      }
    } catch (e) {
      // ignore parse errors
    }
  }, []);

  // For display, prefer context user, then localStorage fallback
  const displayUser = user || localUser;
  useEffect(() => {
    console.debug('Header auth state:', { user, localUser, isAuthenticated });
  }, [user, localUser, isAuthenticated]);

  return (
    <header className="sticky top-0 z-50">
      {/* Top gradient bar */}
      <div className="shopee-topbar py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-sm flex justify-between items-center">
          <div className="flex items-center space-x-4 text-white">
            <a href="/seller" target="_blank" rel="noopener noreferrer" className="hidden sm:inline hover:underline">Kênh Người Bán</a>
            <span className="hidden sm:inline">Tải ứng dụng</span>
            <span className="hidden sm:inline">Kết nối</span>
          </div>
          <div className="flex items-center space-x-4 text-white">
            <span className="hidden sm:inline">Thông Báo</span>
            <span className="hidden sm:inline">Hỗ Trợ</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="bg-gradient-to-r from-primary to-orange-400 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center space-x-6">
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-white">Ecommo</Link>
          </div>

          <div className="flex-1">
            <div className="flex items-center max-w-3xl mx-auto">
              <div className="relative flex-1">
                <input type="text" placeholder="Tìm sản phẩm, thương hiệu, và tên shop" className="shopee-search-input w-full px-6 py-3 pr-12" />
                <i className="material-icons inside-input">search</i>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-white">
            <Link href="/cart" className="relative">
              <ShoppingCart className="w-6 h-6" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-white text-primary text-xs rounded-full w-5 h-5 flex items-center justify-center">{itemCount}</span>
              )}
            </Link>

            {isAuthenticated && displayUser ? (
              <div className="hidden sm:flex items-center space-x-2">
                <UserIcon className="w-6 h-6" />
                <span className="text-white">{displayUser?.name || displayUser?.email}</span>
              </div>
            ) : (
              <Link href="/auth/login" className="text-white hidden sm:inline">Đăng nhập</Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
