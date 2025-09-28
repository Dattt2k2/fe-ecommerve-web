"use client";

import { useState } from 'react';
import { Package, ShoppingCart, Menu, X, Bell, Search, Plus } from 'lucide-react';
import Link from 'next/link';

export default function SellerDashboard({ children }: { children?: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const menuItems = [
        { id: 'inventory', label: 'Kho hàng', icon: Package, href: '/seller/inventory' },
        { id: 'orders', label: 'Đơn hàng', icon: ShoppingCart, href: '/seller/orders' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 bg-orange-500 rounded-lg">
                <Package className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">Kênh Người Bán</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="w-5 h-5" />
            </button>
            </div>

            <nav className="mt-6 px-3">
            <ul className="space-y-1">
                {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                    <li key={item.id}>
                    <Link href={item.href} className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Icon className="w-5 h-5 mr-3" />
                        {item.label}
                    </Link>
                    </li>
                );
                })}
            </ul>
            </nav>
        </div>

        <div className="lg:pl-64">
            <main className="p-6">{children}</main>
        </div>
        </div>
    );
}
