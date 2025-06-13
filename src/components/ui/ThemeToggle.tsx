// src/components/ui/ThemeToggle.tsx
'use client';

import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const { theme, actualTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="p-2 rounded-lg w-9 h-9">
        <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
      </div>
    );
  }

  const themes = [
    { 
      value: 'light', 
      label: 'Sáng', 
      icon: Sun,
      description: 'Luôn sử dụng giao diện sáng'
    },
    { 
      value: 'dark', 
      label: 'Tối', 
      icon: Moon,
      description: 'Luôn sử dụng giao diện tối'
    },
    { 
      value: 'system', 
      label: 'Hệ thống', 
      icon: Monitor,
      description: 'Theo cài đặt hệ thống/trình duyệt'
    },
  ] as const;

  const currentTheme = themes.find(t => t.value === theme);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800"
        title="Chọn theme"
        aria-label="Chọn theme"
      >
        {currentTheme && <currentTheme.icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 overflow-hidden">
            <div className="py-1">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700">
                Chế độ hiển thị
              </div>
              
              {themes.map(({ value, label, icon: Icon, description }) => (
                <button
                  key={value}
                  onClick={() => {
                    setTheme(value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    theme === value 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 text-left">
                    <div className="font-medium">{label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {description}
                    </div>
                    {theme === value && value === 'system' && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Hiện tại: {actualTheme === 'dark' ? 'Tối' : 'Sáng'}
                      </div>
                    )}
                  </div>
                  {theme === value && (
                    <div className="ml-2 w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-1.5 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
            
            <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
              💡 Hệ thống sẽ tự động theo cài đặt trình duyệt của bạn
            </div>
          </div>
        </>
      )}
    </div>
  );
}
