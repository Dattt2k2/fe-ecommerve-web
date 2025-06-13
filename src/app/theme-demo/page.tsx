import Header from '@/components/layout/Header';
import ThemeStatus from '@/components/ui/ThemeStatus';
import ThemeTester from '@/components/ui/ThemeTester';

export default function ThemeDemoPage() {
  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Theme Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Kiểm tra các theme khác nhau của ứng dụng
          </p>
        </div>

        {/* Theme Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <ThemeStatus />
          <ThemeTester />
        </div>

        {/* Theme Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              🌞 Light Mode
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Giao diện sáng với màu nền trắng và văn bản tối
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              🌙 Dark Mode
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Giao diện tối với màu nền đen và văn bản sáng
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              💻 System Mode
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Tự động theo cài đặt hệ thống/trình duyệt
            </p>
          </div>
        </div>

        {/* Sample Components */}
        <div className="space-y-8">
          {/* Buttons */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Buttons
            </h3>
            <div className="flex flex-wrap gap-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                Primary Button
              </button>
              <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
                Secondary Button
              </button>
              <button className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors">
                Outline Button
              </button>
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
                Danger Button
              </button>
            </div>
          </div>

          {/* Form Elements */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Form Elements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Text Input
                </label>
                <input
                  type="text"
                  placeholder="Nhập text..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <option>Tùy chọn 1</option>
                  <option>Tùy chọn 2</option>
                  <option>Tùy chọn 3</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Cards
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Card 1</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                  Nội dung card với background nhạt
                </p>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-100">Card 2</h4>
                <p className="text-blue-700 dark:text-blue-300 text-sm mt-2">
                  Nội dung card với màu xanh
                </p>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-medium text-green-900 dark:text-green-100">Card 3</h4>
                <p className="text-green-700 dark:text-green-300 text-sm mt-2">
                  Nội dung card với màu xanh lá
                </p>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Alerts
            </h3>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 px-4 py-3 rounded-lg">
                <strong>Info:</strong> Đây là thông báo thông tin
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg">
                <strong>Success:</strong> Thao tác đã thành công
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-lg">
                <strong>Warning:</strong> Cảnh báo quan trọng
              </div>
              
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
                <strong>Error:</strong> Có lỗi xảy ra
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">
              Cách sử dụng Theme
            </h3>
            <p className="mb-4">
              Click vào biểu tượng theme ở header để chuyển đổi giữa các chế độ
            </p>
            <ul className="text-left inline-block space-y-1">
              <li>🌞 Light: Giao diện sáng</li>
              <li>🌙 Dark: Giao diện tối</li>
              <li>💻 System: Theo hệ thống</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
