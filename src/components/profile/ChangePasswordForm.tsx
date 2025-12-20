"use client";

import React, { useState } from 'react';
import { apiClient, API_ENDPOINTS } from '@/lib/api';
import Modal from '@/components/ui/Modal';

export default function ChangePasswordForm() {
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    message: '',
    type: 'info',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (!formData.old_password || !formData.new_password || !formData.confirm_password) {
      setError('Vui lòng điền đầy đủ các trường');
      setLoading(false);
      return;
    }

    if (formData.new_password.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      setLoading(false);
      return;
    }

    if (formData.new_password !== formData.confirm_password) {
      setError('Mật khẩu mới và xác nhận mật khẩu không khớp');
      setLoading(false);
      return;
    }

    if (formData.old_password === formData.new_password) {
      setError('Mật khẩu mới phải khác mật khẩu cũ');
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.post(
        API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
        {
          old_password: formData.old_password,
          new_password: formData.new_password,
        }
      );

      // Thành công
      setModal({
        isOpen: true,
        title: 'Thành công',
        message: 'Đổi mật khẩu thành công!',
        type: 'success',
      });

      // Reset form
      setFormData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (err: any) {
      console.error('Error changing password:', err);
      let errorMessage = 'Không thể đổi mật khẩu';
      
      // Parse error message
      try {
        const errorData = typeof err?.message === 'string' ? JSON.parse(err.message) : err;
        errorMessage = errorData?.data?.error || errorData?.error || err?.message || errorMessage;
      } catch {
        errorMessage = err?.message || errorMessage;
      }

      setError(errorMessage);
      setModal({
        isOpen: true,
        title: 'Lỗi',
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">

        {/* Form Card */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Mật khẩu cũ */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Mật khẩu hiện tại *
              </label>
              <input
                type="password"
                name="old_password"
                value={formData.old_password}
                onChange={handleChange}
                placeholder="Nhập mật khẩu hiện tại"
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              />
            </div>

            {/* Mật khẩu mới */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Mật khẩu mới *
              </label>
              <input
                type="password"
                name="new_password"
                value={formData.new_password}
                onChange={handleChange}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                required
                minLength={6}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Xác nhận mật khẩu mới *
              </label>
              <input
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                placeholder="Nhập lại mật khẩu mới"
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-xl">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-700 dark:text-red-400 font-medium">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <span>Đổi mật khẩu</span>
                  </>
                )}
              </button>
            </div>
          </form>

        {/* Modal thông báo */}
        <Modal
          isOpen={modal.isOpen}
          onClose={() => setModal({ ...modal, isOpen: false })}
          title={modal.title}
          message={modal.message}
          type={modal.type}
        />
      </div>
    </div>
  );
}