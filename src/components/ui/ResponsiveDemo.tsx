'use client';

import { useState } from 'react';
import { Monitor, Tablet, Smartphone } from 'lucide-react';

export default function ResponsiveDemo() {
  const [activeBreakpoint, setActiveBreakpoint] = useState('desktop');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4">Responsive Design Demo</h2>
      
      {/* Breakpoint Indicator */}
      <div className="mb-6">
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-4 h-4" />
            <span className="block sm:hidden text-green-600 font-semibold">Mobile (&lt; 640px)</span>
            <span className="hidden sm:block text-gray-400">Mobile</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Tablet className="w-4 h-4" />
            <span className="hidden sm:block lg:hidden text-green-600 font-semibold">Tablet (640px - 1024px)</span>
            <span className="block sm:hidden lg:block text-gray-400">Tablet</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Monitor className="w-4 h-4" />
            <span className="hidden lg:block text-green-600 font-semibold">Desktop (≥ 1024px)</span>
            <span className="block lg:hidden text-gray-400">Desktop</span>
          </div>
        </div>
      </div>

      {/* Responsive Grid Demo */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Grid Layout</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="bg-gradient-to-r from-primary to-orange-400 text-white p-4 rounded-lg text-center">
              <div className="text-lg font-bold">Item {item}</div>
              <div className="text-xs mt-1 opacity-80">
                <span className="block sm:hidden">1 col</span>
                <span className="hidden sm:block lg:hidden">2 cols</span>
                <span className="hidden lg:block xl:hidden">3 cols</span>
                <span className="hidden xl:block">4 cols</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Text Sizing Demo */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Typography</h3>
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary">
            Responsive Heading
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400">
            This paragraph adjusts its size based on screen width. On mobile it's smaller, on tablet it's medium, and on desktop it's larger.
          </p>
        </div>
      </div>

      {/* Button Sizing Demo */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Buttons</h3>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <button className="px-4 py-2 sm:px-6 sm:py-3 bg-primary text-white rounded-lg text-sm sm:text-base hover:bg-orange-600 transition-colors">
            Responsive Button
          </button>
          <button className="px-4 py-2 sm:px-6 sm:py-3 border border-primary text-primary rounded-lg text-sm sm:text-base hover:bg-primary hover:text-white transition-colors">
            Secondary Button
          </button>
        </div>
      </div>

      {/* Spacing Demo */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Spacing & Padding</h3>
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2 sm:p-4 lg:p-6">
          <div className="bg-white dark:bg-gray-600 rounded p-2 sm:p-3 lg:p-4 space-y-1 sm:space-y-2 lg:space-y-3">
            <div className="h-2 bg-primary rounded w-full"></div>
            <div className="h-2 bg-primary rounded w-3/4"></div>
            <div className="h-2 bg-primary rounded w-1/2"></div>
            <div className="text-xs sm:text-sm lg:text-base text-center text-gray-600 dark:text-gray-400">
              Padding and spacing adjust automatically
            </div>
          </div>
        </div>
      </div>

      {/* Screen Size Info */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="font-semibold mb-2">Current Breakpoints:</h4>
        <div className="text-sm space-y-1">
          <div>• Mobile: &lt; 640px (sm)</div>
          <div>• Tablet: 640px - 1024px (sm to lg)</div>
          <div>• Desktop: ≥ 1024px (lg+)</div>
          <div>• Large Desktop: ≥ 1280px (xl+)</div>
        </div>
      </div>
    </div>
  );
}