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
        <div className="p-6 relative">
            <h1 className="text-2xl font-bold mb-4">Quản lý địa chỉ</h1>

            <button onClick={() => { setShowForm(!showForm); setEditingAddress(null); }} className="px-4 py-2 bg-blue-600 text-white rounded mb-4">
                {showForm ? 'Đóng' : 'Thêm địa chỉ'}
            </button>

            {showForm && (
                <>
                    <div className="fixed inset-0 backdrop-blur-md" style={{ overflow: 'hidden' }}></div>
                    <div className="fixed inset-0 flex items-center justify-center">
                        <form onSubmit={handleAddOrUpdate} className="bg-gray-800 p-8 rounded-lg shadow-2xl text-center text-white space-y-4 max-w-xl w-full transition-transform transform scale-95">
                            <div className="grid grid-cols-1 gap-4">
                                <input value={form.street || ''} onChange={e => handleChange('street', e.target.value)} placeholder="Địa chỉ (số nhà, đường)" className="w-full p-3 border rounded" />
                                <input value={form.city || ''} onChange={e => handleChange('city', e.target.value)} placeholder="Thành phố" className="w-full p-3 border rounded" />
                                <div className="flex items-center justify-between">
                                    <span>Đặt làm mặc định</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={form.is_default || false} onChange={e => handleChange('is_default', e.target.checked)} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-center space-x-6">
                                <button type="submit" className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700">
                                    {editingAddress ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ'}
                                </button>
                                <button type="button" onClick={() => { setShowForm(false); setEditingAddress(null); }} className="px-6 py-3 bg-gray-600 text-white rounded">Hủy</button>
                            </div>
                        </form>
                    </div>
                    <style>{`body { overflow: hidden; }`}</style>
                </>
            )}

            {loading && <div className="text-sm text-gray-300">Đang xử lý...</div>}
            {error && <div className="text-sm text-red-400 mb-3">{error}</div>}

            <ul className="space-y-4">
                {addresses.length === 0 && !loading && <li className="text-gray-400">Chưa có địa chỉ nào.</li>}
                {addresses.map(address => (
                    <li key={address.id} className="p-4 border rounded-lg shadow bg-slate-800 text-white">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-medium">{address.street}</p>
                                <p className="text-sm text-gray-300">{address.city}</p>
                                {address.is_default && <p className="text-sm text-green-400">Mặc định</p>}
                            </div>
                            <div className="flex-shrink-0 ml-4 flex flex-col space-y-2">
                                <button onClick={() => { setForm(address); setEditingAddress(address); setShowForm(true); }} className="px-3 py-1 bg-blue-600 rounded text-sm">Sửa</button>
                                <button onClick={() => { setAddressToDelete(address); setShowDeleteModal(true); }} className="px-3 py-1 bg-red-600 rounded text-sm">Xóa</button>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>

            {showDeleteModal && (
                <>
                    <div className="fixed inset-0 backdrop-blur-md" style={{ overflow: 'hidden' }}></div>
                    <div className="fixed inset-0 flex items-center justify-center">
                        <div className="bg-gray-800 p-6 rounded shadow-lg text-center text-white">
                            <p className="mb-4">Bạn có chắc muốn xóa địa chỉ này?</p>
                            <div className="flex justify-center space-x-4">
                                <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded">Xóa</button>
                                <button onClick={() => { setShowDeleteModal(false); setAddressToDelete(null); }} className="px-4 py-2 bg-gray-600 text-white rounded">Hủy</button>
                            </div>
                        </div>
                    </div>
                    <style>{`body { overflow: hidden; }`}</style>
                </>
            )}
        </div>
    );
};

export default AddressManagementPage;