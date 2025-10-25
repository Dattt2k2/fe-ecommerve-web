// src/components/layout/Header.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { ShoppingCart, User as UserIcon, Search, Package, LogOut, Settings } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { itemCount } = useCart();
  const { user, logout, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const showSearch = !(pathname || '').startsWith('/seller');

  // Ensure we only render auth UI after client hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  const displayUser = user;
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (buttonRef.current && buttonRef.current.contains(e.target as Node)) {
        return;
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  return (
    <header className="sticky top-0 z-100 bg-white shadow-sm w-full">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-orange-500 to-black py-1 sm:py-2">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center text-xs sm:text-sm text-white">
            {/* Left Links */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link 
                href="/seller/inventory" 
                className="hidden md:inline hover:underline transition-all duration-200 hover:text-orange-100"
              >
                Kênh Người Bán
              </Link>
              <span className="hidden lg:inline cursor-pointer hover:underline hover:text-orange-100 transition-all">
                Tải ứng dụng
              </span>
              <span className="hidden lg:inline cursor-pointer hover:underline hover:text-orange-100 transition-all">
                Kết nối
              </span>
            </div>

            {/* Right Links */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="hidden md:inline cursor-pointer hover:underline hover:text-orange-100 transition-all">
                Thông Báo
              </span>
              <span className="hidden md:inline cursor-pointer hover:underline hover:text-orange-100 transition-all">
                Hỗ Trợ
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-gradient-to-r from-orange-500 to-black py-3 sm:py-4 lg:py-5">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            
            {/* Logo and Search */}
            <div className="flex items-center space-x-4 sm:space-x-6 flex-1 min-w-0">
              {/* Logo */}
              <Link 
                href="/" 
                className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white hover:opacity-90 transition-opacity flex-shrink-0"
              >
                Ecommo
              </Link>

              {/* Search Bar */}
              {showSearch && (
                <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-2xl xl:max-w-3xl">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Tìm sản phẩm, thương hiệu..." 
                      className="w-full bg-white rounded-full px-4 sm:px-6 py-2 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base text-gray-700 placeholder-gray-500 border-none outline-none focus:ring-2 focus:ring-orange-200 transition-all shadow-sm"
                    />
                    <button className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1 sm:p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-all">
                      <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              
              {/* Cart */}
              <Link 
                href="/cart" 
                className="relative p-2 text-white hover:bg-white hover:bg-opacity-10 rounded-xl transition-all duration-200 group"
              >
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-105 transition-transform" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center shadow-lg border-2 border-white">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              {mounted && (isAuthenticated && displayUser ? (
                <>
                  {/* Desktop User Menu */}
                  <div className="hidden sm:block relative">
                    <button
                      ref={buttonRef}
                      className="flex items-center space-x-2 p-2 text-white hover:bg-white hover:bg-opacity-10 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-20 group"
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      aria-haspopup="true"
                      aria-expanded={isMenuOpen}
                    >
                      <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-105 transition-transform" />
                      <span className="text-xs sm:text-sm font-medium truncate max-w-16 sm:max-w-20 lg:max-w-28">
                        {displayUser?.name || displayUser?.email}
                      </span>
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40"
                          onClick={() => setIsMenuOpen(false)}
                        />
                        
                        <div 
                          ref={menuRef} 
                          className="absolute right-0 top-full mt-3 w-64 bg-white text-gray-900 rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-slide-in-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* User Info Header */}
                          <div className="px-4 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-primary to-orange-400 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                                {(displayUser?.name || displayUser?.email || '?')[0].toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-gray-900 truncate">
                                  {displayUser?.name || displayUser?.email}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {displayUser?.email}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Menu Items */}
                          <div className="py-2">
                            <Link 
                              href="/profile" 
                              onClick={() => setIsMenuOpen(false)} 
                              className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-primary transition-all duration-200 group"
                            >
                              <UserIcon className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                              <span className="font-medium">Hồ sơ cá nhân</span>
                            </Link>
                            
                            {displayUser?.role === 'admin' && (
                              <Link 
                                href="/admin" 
                                onClick={() => setIsMenuOpen(false)} 
                                className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-primary transition-all duration-200 group"
                              >
                                <Settings className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                                <span className="font-medium">Quản lý Admin</span>
                              </Link>
                            )}

                            {displayUser?.role !== 'admin' && (
                              <Link 
                                href="/seller/inventory" 
                                onClick={() => setIsMenuOpen(false)} 
                                className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-primary transition-all duration-200 group"
                              >
                                <Package className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                                <span className="font-medium">Kênh Người Bán</span>
                              </Link>
                            )}
                            
                            <div className="border-t border-gray-100 my-2 mx-4"></div>
                            
                            <button
                              onClick={() => { 
                                setIsMenuOpen(false); 
                                logout(); 
                              }}
                              className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-all duration-200 group font-medium"
                            >
                              <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                              <span>Đăng xuất</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Mobile User Icon */}
                  <div className="sm:hidden">
                    <Link 
                      href="/profile" 
                      className="p-2 text-white hover:bg-white hover:bg-opacity-10 rounded-xl transition-all duration-200 group"
                    >
                      <UserIcon className="w-5 h-5 group-hover:scale-105 transition-transform" />
                    </Link>
                  </div>
                </>
              ) : (
                /* Login Button */
                <Link 
                  href="/auth/login" 
                  className="flex items-center space-x-2 px-3 py-2 text-white hover:bg-white hover:bg-opacity-10 rounded-xl transition-all duration-200 text-sm font-medium group"
                >
                  <UserIcon className="w-5 h-5 group-hover:scale-105 transition-transform" />
                  <span className="hidden sm:inline">Đăng nhập</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}