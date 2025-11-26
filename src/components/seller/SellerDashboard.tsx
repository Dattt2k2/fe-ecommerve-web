"use client";

import { useState, useEffect } from 'react';
import { Package, ShoppingCart, Menu, X, BarChart3, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SellerDashboard({ children }: { children?: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const router = useRouter();

    const menuItems = [
        { id: 'inventory', label: 'Kho hàng', icon: Package, href: '/seller/inventory' },
        { id: 'orders', label: 'Đơn hàng', icon: ShoppingCart, href: '/seller/orders' },
        { id: 'statistics', label: 'Thống kê', icon: BarChart3, href: '/seller/statistics' },
        { id: 'users', label: 'Quản lý người dùng', icon: Users, href: '/seller/users' },
    ];

    const handleMenuClick = (href: string) => {
        setSidebarOpen(false);
        router.push(href);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    // Close sidebar on larger screens
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-900 dark:from-gray-800 dark:to-black flex flex-col w-full">
            
            {/* Mobile Navigation Bar */}
            <div className="lg:hidden sticky top-20 sm:top-24 z-50 bg-gradient-to-r from-orange-500 to-gray-800 border-b border-gray-700 px-4 py-3 shadow-lg">
                <button
                    onClick={toggleSidebar}
                    className="flex items-center space-x-2 text-white hover:text-orange-200 transition-colors font-medium text-sm bg-transparent border-none cursor-pointer p-2 rounded-lg hover:bg-white hover:bg-opacity-10"
                >
                    <Menu className="w-5 h-5" />
                    <span>Kênh Người Bán</span>
                </button>
            </div>

            {/* Layout Container */}
            <div className="flex flex-1 relative">
                
                {/* Mobile Overlay */}
                {sidebarOpen && (
                    <div 
                        className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in"
                        onClick={closeSidebar}
                    />
                )}

                {/* Sidebar */}
                <aside className={`
                    fixed top-32 sm:top-36 bottom-0 left-0 z-50 
                    w-80 max-w-[85vw] 
                    bg-gradient-to-b  via-gray-800 to-black 
                    text-white transform transition-transform duration-300 ease-in-out 
                    overflow-y-auto shadow-2xl border-r border-gray-700
                    lg:relative lg:top-0 lg:w-64 xl:w-72 2xl:w-80 lg:shadow-lg lg:translate-x-0
                    ${sidebarOpen ? 'translate-x-0 animate-slide-in-left' : '-translate-x-full'}
                `}>
                    
                    {/* Sidebar Header */}
                    <div className="px-6 py-6 border-b border-gray-700 border-opacity-50 relative">
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                                <Package className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-lg font-bold text-white">
                                    Kênh Người Bán
                                </h1>
                                <p className="text-xs text-gray-300">
                                    Quản lý bán hàng
                                </p>
                            </div>
                        </div>

                        {/* Close button for mobile */}
                        <button 
                            onClick={closeSidebar}
                            className="lg:hidden absolute top-4 right-4 p-2 rounded-lg border-none bg-white bg-opacity-10 text-white hover:bg-white hover:bg-opacity-20 transition-all duration-200"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="mt-6 px-4 pb-6">
                        <ul className="space-y-2">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <li key={item.id}>
                                        <button
                                            onClick={() => handleMenuClick(item.href)}
                                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-orange-500/20 hover:to-orange-600/20 hover:shadow-lg hover:scale-105 transition-all duration-200 group bg-transparent border-none cursor-pointer"
                                        >
                                            <Icon className="w-5 h-5 group-hover:text-orange-400 transition-colors" />
                                            <span>{item.label}</span>
                                            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                                            </div>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>

                        {/* Additional Info */}
                        <div className="mt-8 px-4 py-3 bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-xl border border-orange-500/20">
                            <div className="text-xs text-orange-200">
                                <p className="font-medium mb-1">💡 Mẹo bán hàng</p>
                                <p className="text-orange-300/80">Cập nhật sản phẩm thường xuyên để tăng doanh số</p>
                            </div>
                        </div>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0 w-full">
                    <div className="p-4 sm:p-6 lg:p-8 w-full">
                        <div className="w-full">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}