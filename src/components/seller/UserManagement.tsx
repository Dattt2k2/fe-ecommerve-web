'use client';

import { useState, useEffect, useRef } from 'react';
import { User, Search, Mail, Phone, Calendar, ShoppingBag, Eye, Ban, CheckCircle, XCircle, MoreVertical, Trash2, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role?: string;
  createdAt?: string;
  totalOrders?: number;
  totalSpent?: number;
  status?: 'active' | 'inactive';
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const menuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  
  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await apiClient.get(`/api/admin/users?${params.toString()}`);
      
      if (response) {
        const usersArray = response.users || response.data || [];
        
        const normalizedUsers = usersArray.map((user: any) => {
          const fullName = [user.first_name, user.last_name]
            .filter(Boolean)
            .join(' ')
            .trim() || user.name || user.email?.split('@')[0] || 'N/A';
          
          const userType = user.user_type || user.role || 'USER';
          const normalizedRole = userType.toLowerCase();
          
          return {
            id: user.id,
            name: fullName,
            email: user.email,
            phone: user.phone || '',
            avatar: user.avatar || user.avatar_url,
            role: normalizedRole,
            createdAt: user.created_at || user.createdAt || user.created_date,
            totalOrders: user.totalOrders || user.total_orders || user.orders_count || 0,
            totalSpent: user.totalSpent || user.total_spent || user.total_amount || 0,
            status: user.status || (user.is_disabled !== undefined ? (user.is_disabled ? 'inactive' : 'active') : 'active'),
          };
        });
        
        setUsers(normalizedUsers);
        
        if (response.total) {
          setTotalPages(Math.ceil(response.total / (response.limit || itemsPerPage)));
        } else if (response.hasNext !== undefined) {
          const estimatedPages = response.hasNext ? currentPage + 1 : currentPage;
          setTotalPages(estimatedPages);
        } else {
          setTotalPages(1);
        }
      } else {
        setError('Không thể tải danh sách người dùng');
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    if (!openMenuId) {
      setMenuPosition(null);
      return;
    }
    
    const updatePosition = () => {
      const button = menuButtonRefs.current[openMenuId];
      if (button) {
        const rect = button.getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom + 8,
          right: window.innerWidth - rect.right,
        });
      } else {
        setOpenMenuId(null);
        setMenuPosition(null);
      }
    };
    
    // Update position immediately
    updatePosition();
    
    // Update on scroll and resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [openMenuId]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); 
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  const formatPrice = (amount?: number) => {
    if (!amount) return '0₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      setLoadingDetails(true);
      const response = await apiClient.get(`/api/admin/users/${userId}`);
      setUserDetails(response);
    } catch (err: any) {
      console.error('Error fetching user details:', err);
      setError(err.message || 'Không thể tải thông tin chi tiết người dùng');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewUser = async (user: UserData) => {
    setSelectedUser(user);
    setIsModalOpen(true);
    await fetchUserDetails(user.id);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setUserDetails(null);
  };

  const updateUserStatus = async (userId: string, currentStatus: 'active' | 'inactive') => {
    try {
      setUpdatingStatus(userId);
      const newIsDisabled = currentStatus === 'active'; 
      
      const response = await apiClient.patch(`/api/admin/users/${userId}/status`, {
        is_disabled: newIsDisabled
      });

      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, status: newIsDisabled ? 'inactive' : 'active' }
            : user
        )
      );

      if (userDetails && userDetails?.id === userId) {
        setUserDetails((prev: any) => ({
          ...prev,
          is_disabled: newIsDisabled
        }));
      }

      // Cập nhật selectedUser nếu cần
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser((prev: UserData | null) => prev ? {
          ...prev,
          status: newIsDisabled ? 'inactive' : 'active'
        } : null);
      }

      return response;
    } catch (err: any) {
      console.error('Error updating user status:', err);
      setError(err.message || 'Không thể cập nhật trạng thái người dùng');
      throw err;
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDeleteClick = (user: UserData) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
    setOpenMenuId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      setDeleting(true);
      await apiClient.delete(`/api/admin/users/${userToDelete.id}`);

      // Xóa user khỏi danh sách
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete.id));

      // Đóng modal và reset state
      setShowDeleteModal(false);
      setUserToDelete(null);

      // Nếu đang xem chi tiết user bị xóa, đóng modal chi tiết
      if (selectedUser?.id === userToDelete.id) {
        handleCloseModal();
      }
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Không thể xóa người dùng');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải danh sách người dùng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quản lý người dùng</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Quản lý thông tin khách hàng và người dùng</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleStatusFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => handleStatusFilter('active')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'active'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Hoạt động
            </button>
            <button
              onClick={() => handleStatusFilter('inactive')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'inactive'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Không hoạt động
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Người dùng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Thông tin liên hệ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ngày tham gia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <User className="w-12 h-12 text-gray-400 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">Không tìm thấy người dùng nào</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.avatar ? (
                            <img
                              className="h-10 w-10 rounded-full"
                              src={user.avatar}
                              alt={user.name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center">
                              <User className="w-6 h-6 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.role || 'user'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                          <Phone className="w-4 h-4" />
                          {user.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(user.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium cursor-default ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {user.status === 'active' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {user.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative">
                        <button
                          ref={(el) => {
                            menuButtonRefs.current[user.id] = el;
                          }}
                          onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          type="button"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-600">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Trang {currentPage} / {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {openMenuId && menuPosition && (() => {
        const user = users.find(u => u.id === openMenuId);
        if (!user) return null;
        
        return (
          <>
            <div 
              className="fixed inset-0 z-10"
              onClick={() => {
                setOpenMenuId(null);
                setMenuPosition(null);
              }}
            />
            <div 
              className="fixed w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-[50] overflow-hidden"
              style={{
                top: `${menuPosition.top}px`,
                right: `${menuPosition.right}px`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  handleViewUser(user);
                  setOpenMenuId(null);
                  setMenuPosition(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                type="button"
              >
                <Eye className="w-4 h-4" />
                Xem chi tiết
              </button>
              <button
                onClick={() => {
                  updateUserStatus(user.id, user.status || 'active');
                  setOpenMenuId(null);
                  setMenuPosition(null);
                }}
                disabled={updatingStatus === user.id}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                  user.status === 'active'
                    ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                }`}
                type="button"
              >
                {updatingStatus === user.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    <span>Đang cập nhật...</span>
                  </>
                ) : user.status === 'active' ? (
                  <>
                    <Ban className="w-4 h-4" />
                    <span>Vô hiệu hóa</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Kích hoạt</span>
                  </>
                )}
              </button>
              <div className="border-t border-gray-200 dark:border-gray-700"></div>
              <button
                onClick={() => {
                  handleDeleteClick(user);
                  setOpenMenuId(null);
                  setMenuPosition(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                type="button"
              >
                <Trash2 className="w-4 h-4" />
                Xóa người dùng
              </button>
            </div>
          </>
        );
      })()}

      {/* User Details Modal */}
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-[100]"
            onClick={handleCloseModal}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <div 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Header */}
            <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Chi tiết người dùng
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                type="button"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {loadingDetails ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-400">Đang tải thông tin...</p>
                    </div>
                  </div>
                ) : userDetails ? (
                  <div className="space-y-6">
                    {/* User Info */}
                    <div className="flex items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                      {userDetails?.avatar || selectedUser?.avatar ? (
                        <img
                          src={userDetails?.avatar || selectedUser?.avatar}
                          alt={userDetails?.first_name || selectedUser?.name}
                          className="w-20 h-20 rounded-full"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center">
                          <User className="w-10 h-10 text-white" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {userDetails?.first_name && userDetails?.last_name
                            ? `${userDetails.first_name} ${userDetails.last_name}`
                            : userDetails?.first_name || selectedUser?.name || 'N/A'}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          {(userDetails?.user_type || userDetails?.role || selectedUser?.role)?.toLowerCase() || 'user'}
                        </p>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Email
                        </label>
                        <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span>{userDetails?.email || selectedUser?.email || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Số điện thoại
                        </label>
                        <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{userDetails?.phone || selectedUser?.phone || 'N/A'}</span>
                        </div>
                      </div>

                      {/* User Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Loại người dùng
                        </label>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {(userDetails?.user_type || userDetails?.role || selectedUser?.role || 'USER').toUpperCase()}
                        </span>
                      </div>

                      {/* Status */}
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Trạng thái
                        </label>
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                            (userDetails?.is_disabled === false || selectedUser?.status === 'active')
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {(userDetails?.is_disabled === false || selectedUser?.status === 'active') ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Hoạt động
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4" />
                              Không hoạt động
                            </>
                          )}
                        </span>
                      </div>

                      {/* Created At */}
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Ngày tham gia
                        </label>
                        <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{formatDate(userDetails?.created_at || selectedUser?.createdAt)}</span>
                        </div>
                      </div>

                      {/* Updated At */}
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Cập nhật lần cuối
                        </label>
                        <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{formatDate(userDetails?.updated_at)}</span>
                        </div>
                      </div>

                      {/* Total Orders */}
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Tổng đơn hàng
                        </label>
                        <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                          <ShoppingBag className="w-4 h-4 text-gray-400" />
                          <span>{userDetails?.total_orders || userDetails?.orders_count || selectedUser?.totalOrders || 0}</span>
                        </div>
                      </div>

                      {/* Total Spent */}
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Tổng chi tiêu
                        </label>
                        <div className="text-gray-900 dark:text-white font-medium">
                          {formatPrice(userDetails?.total_spent || userDetails?.total_amount || selectedUser?.totalSpent)}
                        </div>
                      </div>
                    </div>

                    {/* User ID */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        ID người dùng
                      </label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                        {userDetails?.id || selectedUser?.id || 'N/A'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">Không thể tải thông tin chi tiết</p>
                  </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-between items-center rounded-b-xl border-t border-gray-200 dark:border-gray-600">
              {userDetails && (userDetails?.id || selectedUser?.id) && (
                <button
                  onClick={() => {
                    const userId = userDetails?.id || selectedUser?.id;
                    if (!userId) return;
                    const currentStatus = (userDetails?.is_disabled === false || selectedUser?.status === 'active') ? 'active' : 'inactive';
                    updateUserStatus(userId, currentStatus);
                  }}
                  disabled={updatingStatus === (userDetails?.id || selectedUser?.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    (userDetails?.is_disabled === false || selectedUser?.status === 'active')
                      ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                      : 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                  }`}
                  type="button"
                >
                  {updatingStatus === (userDetails?.id || selectedUser?.id) ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      <span>Đang cập nhật...</span>
                    </>
                  ) : (userDetails?.is_disabled === false || selectedUser?.status === 'active') ? (
                    <>
                      <Ban className="w-4 h-4" />
                      <span>Vô hiệu hóa tài khoản</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Kích hoạt tài khoản</span>
                    </>
                  )}
                </button>
              )}
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors cursor-pointer"
                type="button"
              >
                Đóng
              </button>
            </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
              onClick={handleDeleteCancel}
            />
            
            {/* Modal Content */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                  <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Xác nhận xóa người dùng
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Bạn có chắc chắn muốn xóa người dùng <span className="font-semibold text-gray-900 dark:text-white">{userToDelete.name || userToDelete.email}</span> không? 
                  Hành động này không thể hoàn tác.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={handleDeleteConfirm}
                    disabled={deleting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    type="button"
                  >
                    {deleting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Đang xóa...
                      </span>
                    ) : (
                      'Xóa người dùng'
                    )}
                  </button>
                  <button 
                    onClick={handleDeleteCancel}
                    disabled={deleting}
                    className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

