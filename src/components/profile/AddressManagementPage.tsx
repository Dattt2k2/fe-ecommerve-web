import React, { useEffect, useState, useRef } from 'react';
import { apiClient } from '@/lib/apiClient';

type Address = {
    id?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    is_default?: boolean;
};

const AddressManagementPage: React.FC = () => {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state for add/edit
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<Address>({ street: '', city: '', is_default: false });
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);

    // Modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);

    // Sử dụng useRef để đảm bảo effect chỉ chạy 1 lần
    const hasInitialized = useRef(false);

    const handleChange = (k: keyof Address, v: string | boolean) => setForm(prev => ({ ...prev, [k]: v }));

    const fetchAddresses = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('[AddressManagementPage] Fetching addresses...');
            const list: Address[] = await apiClient.get('/me/addresses');
            console.log('[AddressManagementPage] Addresses fetched:', list);
            setAddresses(list || []);
        } catch (e: any) {
            console.error('Error fetching addresses:', e);
            setError('Lỗi khi tải địa chỉ');
        } finally {
            setLoading(false);
        }
    };

    // Gọi fetchAddresses khi component được mount (chỉ một lần)
    useEffect(() => {
        console.log('[AddressManagementPage] useEffect - hasInitialized:', hasInitialized.current);
        if (!hasInitialized.current) {
            console.log('[AddressManagementPage] Initializing...');
            hasInitialized.current = true;
            fetchAddresses();
        }
    }, []);

    const handleAddOrUpdate = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (editingAddress) {
                await apiClient.put(`/me/addresses/${editingAddress.id}`, form);
            } else {
                await apiClient.post('/me/addresses', form);
            }
            await fetchAddresses();
            setForm({ street: '', city: '', is_default: false });
            setEditingAddress(null);
            setShowForm(false);
        } catch (err) {
            console.error('Error saving address:', err);
            setError('Không thể lưu địa chỉ');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!addressToDelete) return;
        setLoading(true);
        setError(null);
        try {
            await apiClient.delete(`/me/addresses/${addressToDelete.id}`); 
            await fetchAddresses();
        } catch (err) {
            console.error('Error deleting address:', err);
            setError('Không thể xóa địa chỉ');
        } finally {
            setLoading(false);
            setShowDeleteModal(false);
            setAddressToDelete(null);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header Section */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Quản lý địa chỉ</h1>
                        <p className="text-gray-600 dark:text-gray-400">Quản lý thông tin cá nhân</p>
                    </div>
                    <button 
                        onClick={() => { setShowForm(!showForm); setEditingAddress(null); setForm({ street: '', city: '', is_default: false }); }} 
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        {showForm ? 'Đóng' : 'Thêm địa chỉ'}
                    </button>
                </div>

                {/* Add/Edit Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex min-h-screen items-center justify-center p-4">
                            {/* Backdrop */}
                            <div 
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
                                onClick={() => { setShowForm(false); setEditingAddress(null); }}
                            ></div>
                            
                            {/* Modal Content */}
                            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-8 transform transition-all">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {editingAddress ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
                                    </h2>
                                    <button 
                                        onClick={() => { setShowForm(false); setEditingAddress(null); }}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <form onSubmit={handleAddOrUpdate} className="space-y-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Địa chỉ đầy đủ
                                            </label>
                                            <input 
                                                value={form.street || ''} 
                                                onChange={e => handleChange('street', e.target.value)} 
                                                placeholder="VD: nha 20 ngo 40 duong Nam Yen Lung, An Khanh, Ha Noi" 
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Thành phố
                                            </label>
                                            <input 
                                                value={form.city || ''} 
                                                onChange={e => handleChange('city', e.target.value)} 
                                                placeholder="VD: Hà Nội" 
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                                                required
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Đặt làm địa chỉ mặc định</span>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={form.is_default || false} 
                                                    onChange={e => handleChange('is_default', e.target.checked)} 
                                                    className="sr-only peer" 
                                                />
                                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button 
                                            type="submit" 
                                            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                                        >
                                            {editingAddress ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ'}
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => { setShowForm(false); setEditingAddress(null); }} 
                                            className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-all duration-200"
                                        >
                                            Hủy
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Status Messages */}
                {loading && (
                    <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl mb-6">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <span className="text-blue-600 dark:text-blue-400 font-medium">Đang xử lý...</span>
                    </div>
                )}
                {error && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-xl mb-6">
                        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="text-red-700 dark:text-red-400 font-medium">{error}</span>
                    </div>
                )}

                {/* Address List */}
                <div className="space-y-4">
                    {addresses.length === 0 && !loading && (
                        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                            <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">Chưa có địa chỉ nào</p>
                            <p className="text-gray-400 dark:text-gray-500 text-sm">Thêm địa chỉ đầu tiên của bạn để bắt đầu</p>
                        </div>
                    )}
                    
                    {addresses.map(address => (
                        <div 
                            key={address.id} 
                            className="group bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:scale-[1.02]"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {address.is_default && (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold rounded-full">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                Mặc định
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{address.street}</p>
                                    <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                        </svg>
                                        {address.city}
                                    </p>
                                </div>
                                
                                <div className="flex flex-col gap-2 ml-4">
                                    <button 
                                        onClick={() => { setForm(address); setEditingAddress(address); setShowForm(true); }} 
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Sửa
                                    </button>
                                    <button 
                                        onClick={() => { setAddressToDelete(address); setShowDeleteModal(true); }} 
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Xóa
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex min-h-screen items-center justify-center p-4">
                            {/* Backdrop */}
                            <div 
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
                                onClick={() => { setShowDeleteModal(false); setAddressToDelete(null); }}
                            ></div>
                            
                            {/* Modal Content */}
                            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all">
                                <div className="text-center">
                                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                                        <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        Xác nhận xóa địa chỉ
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                                        Bạn có chắc chắn muốn xóa địa chỉ này? Hành động này không thể hoàn tác.
                                    </p>
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={handleDelete} 
                                            className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                                        >
                                            Xóa địa chỉ
                                        </button>
                                        <button 
                                            onClick={() => { setShowDeleteModal(false); setAddressToDelete(null); }} 
                                            className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-all duration-200"
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
        </div>
    );
};

export default AddressManagementPage;