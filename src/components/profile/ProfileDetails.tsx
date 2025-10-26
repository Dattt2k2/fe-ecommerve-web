import React, { useState, useEffect } from 'react';
import { usersAPI } from '@/lib/api';
import Modal from '@/components/ui/Modal';

interface ProfileDetailsProps {
  user: any;
  setUser: (user: any) => void;
}

const ProfileDetails: React.FC<ProfileDetailsProps> = ({ user, setUser }) => {
  console.log("ProfileDetails user prop:", user);

  if (!user) {
    return <div className="text-white">Không tìm thấy thông tin người dùng. Vui lòng thử lại sau.</div>;
  }

  const [form, setForm] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
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

  // Fetch fresh user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      
      setFetching(true);
      try {
        const response = await usersAPI.getUser(user.id);
        const userData = response?.user || response;
        
        console.log("Fetched user data:", userData);
        
        // Update form with fetched data
        setForm({
          firstName: userData?.first_name || '',
          lastName: userData?.last_name || '',
          email: userData?.email || '',
          phone: userData?.phone || '',
        });
        
        // Update parent user state
        setUser(userData);
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setFetching(false);
      }
    };

    fetchUserData();
  }, [user?.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Lấy nguyên dữ liệu hiện tại từ user, cập nhật những phần thay đổi
      const updatePayload = {
        ...user,
        first_name: form.firstName,
        last_name: form.lastName,
        phone: form.phone,
      };
      
      console.log('Update payload:', updatePayload);
      
      const response: any = await usersAPI.updateUser(user.id, updatePayload as any);
      
      const updatedUser: any = response?.user || response;
      
      console.log('Updated user response:', updatedUser);
      
      // Cập nhật toàn bộ user state với response từ backend
      setUser(updatedUser);
      
      // Cập nhật form với response data
      setForm({
        firstName: updatedUser?.first_name || '',
        lastName: updatedUser?.last_name || '',
        email: updatedUser?.email || '',
        phone: updatedUser?.phone || '',
      });
      
      // Hiển thị modal thành công
      setModal({
        isOpen: true,
        title: 'Thành công',
        message: 'Thông tin cá nhân đã được cập nhật!',
        type: 'success',
      });
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err?.message || 'Không thể cập nhật thông tin');
      
      // Hiển thị modal lỗi
      setModal({
        isOpen: true,
        title: 'Lỗi',
        message: err?.message || 'Không thể cập nhật thông tin',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="text-white">Đang tải thông tin...</div>;
  }

  return (
    <div className="text-white">
      <h2 className="text-xl font-bold mb-4">Hồ sơ cá nhân</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Họ</label>
          <input
            type="text"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            className="w-full border border-gray-600 bg-gray-800 text-white p-2 rounded focus:outline-none focus:border-orange-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Tên</label>
          <input
            type="text"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            className="w-full border border-gray-600 bg-gray-800 text-white p-2 rounded focus:outline-none focus:border-orange-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border border-gray-600 bg-gray-700 text-gray-400 p-2 rounded opacity-60 cursor-not-allowed"
            disabled
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Số điện thoại</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full border border-gray-600 bg-gray-800 text-white p-2 rounded focus:outline-none focus:border-orange-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Đang cập nhật...' : 'Cập nhật'}
        </button>
        {error && <p className="text-red-400 mt-2">{error}</p>}
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
  );
};

export default ProfileDetails;