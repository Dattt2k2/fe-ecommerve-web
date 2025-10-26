import React from 'react';

type ProfileSidebarProps = {
    activeTab: string;
    setActiveTab: (tab: string) => void;
};

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ activeTab, setActiveTab }) => {
    const tabs = [
        { id: 'personal-info', label: 'Thông tin cá nhân' },
        { id: 'addresses', label: 'Địa chỉ' },
        { id: 'change-password', label: 'Đổi mật khẩu' },
    ];

    return (
        <aside className="
            fixed top-32 sm:top-36 bottom-0 left-0 z-50 
            w-80 max-w-[85vw] 
            bg-gradient-to-b via-gray-800 to-black 
            text-white transform transition-transform duration-300 ease-in-out 
            overflow-y-auto shadow-2xl border-r border-gray-700
            lg:relative lg:top-0 lg:w-64 xl:w-72 2xl:w-80 lg:shadow-lg lg:translate-x-0
        ">
            <div className="px-6 py-6 border-b border-gray-700 border-opacity-50">
                <h1 className="text-lg font-bold text-white">Hồ sơ của tôi</h1>
                <p className="text-xs text-gray-300">Quản lý thông tin cá nhân</p>
            </div>

            <nav className="mt-6 px-4 pb-6">
                <ul className="space-y-2">
                    {tabs.map((tab) => (
                        <li key={tab.id}>
                            <button
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium 
                                    ${activeTab === tab.id ? 'text-white bg-gradient-to-r from-orange-500/20 to-orange-600/20 shadow-lg scale-105' : 'text-gray-300'}
                                    hover:text-white hover:bg-gradient-to-r hover:from-orange-500/20 hover:to-orange-600/20 hover:shadow-lg hover:scale-105 
                                    transition-all duration-200 group bg-transparent border-none cursor-pointer
                                `}
                            >
                                <span>{tab.label}</span>
                                {activeTab === tab.id && (
                                    <div className="ml-auto opacity-100 transition-opacity">
                                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                                    </div>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

export default ProfileSidebar;