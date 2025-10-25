import ResponsiveDemo from '@/components/ui/ResponsiveDemo';

export default function ResponsiveDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">Responsive Design Demo</h1>
          <p className="text-gray-600 dark:text-gray-400 text-center">
            Test responsive features by resizing your browser window or using dev tools
          </p>
        </div>
        
        <ResponsiveDemo />
        
        {/* Additional responsive sections */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Seller Dashboard Features</h2>
            <ul className="space-y-2 text-sm">
              <li>✅ Responsive sidebar (collapsible on mobile)</li>
              <li>✅ Mobile menu button with overlay</li>
              <li>✅ Adaptive spacing and typography</li>
              <li>✅ Touch-friendly button sizes</li>
              <li>✅ Flexible grid layouts</li>
            </ul>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Header Features</h2>
            <ul className="space-y-2 text-sm">
              <li>✅ Responsive navigation bar</li>
              <li>✅ Adaptive search input</li>
              <li>✅ Mobile-optimized user menu</li>
              <li>✅ Scalable icons and text</li>
              <li>✅ Flexible cart icon with badge</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}