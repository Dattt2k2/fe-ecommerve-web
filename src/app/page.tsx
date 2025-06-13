export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Chào mừng đến với ShopVN
          </h1>
          <p className="text-xl md:text-2xl mb-8">
            Khám phá hàng nghìn sản phẩm chất lượng với giá tốt nhất
          </p>
          <div className="space-x-4">
            <a
              href="/products"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
            >
              Mua sắm ngay
            </a>
            <a
              href="/auth/login"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-block"
            >
              Đăng nhập
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-gray-100">
            Tại sao chọn ShopVN?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 text-center">
              <div className="text-4xl mb-4">🚚</div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Giao hàng nhanh</h3>
              <p className="text-gray-600 dark:text-gray-400">Giao hàng trong 24h tại TP.HCM và Hà Nội</p>
            </div>
            
            <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 text-center">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Giá tốt nhất</h3>
              <p className="text-gray-600 dark:text-gray-400">Cam kết giá rẻ nhất thị trường</p>
            </div>
            
            <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Thanh toán an toàn</h3>
              <p className="text-gray-600 dark:text-gray-400">Bảo mật thông tin 100%</p>
            </div>
          </div>
        </div>
      </section>

      {/* Theme Demo Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">
            Chế độ Dark/Light
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Giao diện tự động theo cài đặt hệ thống của bạn hoặc tùy chỉnh theo sở thích
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-2xl mx-auto border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Tính năng Theme
            </h3>
            <ul className="text-left space-y-2 text-gray-600 dark:text-gray-400">
              <li>✅ Tự động theo hệ thống</li>
              <li>✅ Chế độ sáng</li> 
              <li>✅ Chế độ tối</li>
              <li>✅ Lưu lựa chọn của bạn</li>
              <li>✅ Responsive trên mọi thiết bị</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
