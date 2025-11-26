'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Vui lòng nhập email');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email không hợp lệ');
      return;
    }
    
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSent(true);
    } catch (error) {
      setError('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Email đã được gửi!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Chúng tôi đã gửi link đặt lại mật khẩu đến email <strong>{email}</strong>. 
              Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.
            </p>
            <div className="space-y-3">
              <Link
                href="/auth/login"
                className="w-full bg-blue-600 dark:bg-blue-700 text-white py-3 px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors inline-block"
              >
                Quay lại đăng nhập
              </Link>
              <button
                onClick={() => setSent(false)}
                className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 py-2"
              >
                Gửi lại email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">Ecommo</h1>
          <p className="text-gray-600 dark:text-gray-400">Nền tảng mua sắm trực tuyến hàng đầu</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          {!sent ? (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Quên mật khẩu?</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                        error ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Nhập email của bạn"
                    />
                  </div>
                  {error && (
                    <p className="text-red-500 dark:text-red-400 text-sm mt-1">{error}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Đang gửi...' : 'Gửi hướng dẫn'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Email đã được gửi!</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email: <br />
                <span className="font-medium text-gray-900 dark:text-white">{email}</span>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Không thấy email? Hãy kiểm tra thư mục spam hoặc thử lại sau vài phút.
              </p>
              <button
                onClick={() => {
                  setSent(false);
                  setEmail('');
                  setError('');
                }}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                Gửi lại email
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
