// src/components/ui/ThemeTester.tsx
'use client';

import { useTheme } from '@/context/ThemeContext';
import { useState, useEffect } from 'react';

export default function ThemeTester() {
  const { theme, actualTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    setMounted(true);
    
    // Get system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemPreference(mediaQuery.matches ? 'dark' : 'light');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  if (!mounted) {
    return (
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Theme Tester
      </h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => setTheme('light')}
            className={`p-3 rounded-lg border-2 transition-all ${
              theme === 'light'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">🌞</div>
              <div className="font-medium">Light</div>
            </div>
          </button>
          
          <button
            onClick={() => setTheme('dark')}
            className={`p-3 rounded-lg border-2 transition-all ${
              theme === 'dark'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">🌙</div>
              <div className="font-medium">Dark</div>
            </div>
          </button>
          
          <button
            onClick={() => setTheme('system')}
            className={`p-3 rounded-lg border-2 transition-all ${
              theme === 'system'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">💻</div>
              <div className="font-medium">System</div>
            </div>
          </button>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Cài đặt hiện tại:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Theme đang áp dụng:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {actualTheme.charAt(0).toUpperCase() + actualTheme.slice(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Hệ thống prefer:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {systemPreference.charAt(0).toUpperCase() + systemPreference.slice(1)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 dark:text-gray-400">
          💡 Thay đổi cài đặt Dark Mode trong hệ thống để xem System mode hoạt động
        </div>
      </div>
    </div>
  );
}
