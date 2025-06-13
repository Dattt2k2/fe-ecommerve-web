export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
          CSS Test Page
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Styles Test */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Basic Styles
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Đây là đoạn text để test màu sắc và typography.
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
              Test Button
            </button>
          </div>
          
          {/* Colors Test */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Colors Test
            </h2>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-red-500 h-8 rounded"></div>
              <div className="bg-green-500 h-8 rounded"></div>
              <div className="bg-blue-500 h-8 rounded"></div>
              <div className="bg-yellow-500 h-8 rounded"></div>
              <div className="bg-purple-500 h-8 rounded"></div>
              <div className="bg-pink-500 h-8 rounded"></div>
            </div>
          </div>
          
          {/* Responsive Test */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Responsive Test
            </h2>
            <div className="text-sm sm:text-base md:text-lg lg:text-xl">
              Text size changes based on screen size
            </div>
          </div>
          
          {/* Dark Mode Test */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Dark Mode Test
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Background và text color sẽ thay đổi khi chuyển dark mode.
            </p>
          </div>
        </div>
        
        {/* Flexbox Test */}
        <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Flexbox Test
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded flex-1">
              Flex item 1
            </div>
            <div className="bg-green-100 dark:bg-green-900 p-4 rounded flex-1">
              Flex item 2
            </div>
            <div className="bg-red-100 dark:bg-red-900 p-4 rounded flex-1">
              Flex item 3
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Nếu bạn thấy styling và colors đẹp thì Tailwind CSS đã hoạt động! 🎉
          </p>
        </div>
      </div>
    </div>
  );
}
