// src/components/ui/ThemeStatus.tsx
'use client';

import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ThemeStatus() {
  const { theme, actualTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center space-x-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
        <div className="w-20 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
      </div>
    );
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-5 h-5 text-yellow-500" />;
      case 'dark':
        return <Moon className="w-5 h-5 text-blue-400" />;
      case 'system':
        return <Monitor className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
      default:
        return <Monitor className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Giao diện sáng';
      case 'dark':
        return 'Giao diện tối';
      case 'system':
        return 'Theo hệ thống';
      default:
        return 'Không xác định';
    }
  };

  const getActualThemeLabel = () => {
    return actualTheme === 'light' ? 'Sáng' : 'Tối';
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
        Trạng thái Theme
      </h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Cài đặt:</span>
          <div className="flex items-center space-x-2">
            {getThemeIcon()}
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {getThemeLabel()}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Hiện tại:</span>
          <div className="flex items-center space-x-2">
            {actualTheme === 'light' ? (
              <Sun className="w-4 h-4 text-yellow-500" />
            ) : (
              <Moon className="w-4 h-4 text-blue-400" />
            )}
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {getActualThemeLabel()}
            </span>
          </div>
        </div>
        
        {theme === 'system' && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              💡 Tự động thay đổi theo cài đặt hệ thống của bạn
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
