'use client';

import { Layout, Button, Avatar, Dropdown, Input, Badge } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, BellOutlined, SearchOutlined } from '@ant-design/icons';
import { LogOut, User as UserIcon, Settings, LayoutGrid } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

import Cookies from 'js-cookie';
import { useEffect } from 'react';

const { Header } = Layout;

export default function AppHeader() {
  const { sidebarCollapsed, toggleSidebar, globalSearch, setGlobalSearch } = useUiStore();
  const { user, logout, fetchUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleLogout = () => {
    const domain = process.env.NEXT_PUBLIC_DOMAIN || '.dkpharma.io.vn';
    const authUrl = process.env.NEXT_PUBLIC_FRONTEND_ROOT_URL || 'https://hrm.dkpharma.io.vn';
    
    logout();
    Cookies.remove('accessToken', { domain, path: '/' });
    Cookies.remove('refreshToken', { domain, path: '/' });
    Cookies.remove('id', { domain, path: '/' });
    window.location.href = `${authUrl}/login`;
  };

  // Đồng bộ cấu trúc Menu với UserCard của HRM
  const userMenu: any = [
    { key: 'setting', label: <span className="flex items-center"><Settings className="mr-2 h-4 w-4" /> Cài đặt</span>, onClick: () => router.push('/setting') },
    { key: 'profile', label: <span className="flex items-center"><UserIcon className="mr-2 h-4 w-4" /> Hồ sơ cá nhân</span>, onClick: () => router.push('/profile') },
    { key: 'apps', label: <span className="flex items-center"><LayoutGrid className="mr-2 h-4 w-4" /> Tất cả ứng dụng</span>, onClick: () => { window.location.href = process.env.NEXT_PUBLIC_FRONTEND_ROOT_URL || 'https://hrm.dkpharma.io.vn'; } },
    { type: 'divider' },
    { key: 'logout', label: <span className="flex items-center"><LogOut className="mr-2 h-4 w-4" /> Đăng xuất</span>, onClick: handleLogout },
  ];

  return (
    <Header 
      className="flex items-center justify-between p-2 px-4 border-b border-gray-200 h-[60px] sticky top-0 z-10"
      style={{ backgroundColor: '#ffffff', padding: '0 16px' }}
    >
      {/* KHỐI BÊN TRÁI: Logo và Tiêu đề */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          {sidebarCollapsed ? <MenuUnfoldOutlined className="text-xl text-gray-700" /> : <MenuFoldOutlined className="text-xl text-gray-700" />}
        </button>
        
        {/* Đã tải Logo về local (dkpharmalogo.png) */}
        <img 
          src="/dkpharmalogo.png" 
          alt="DKPharma Logo" 
          className="p-1 h-[45px] object-contain hidden sm:block" 
        />
        
        <h1 className="text-xl hidden md:block m-0 font-medium text-gray-800">Hồ Sơ Công Bố SCB</h1>
      </div>

      {/* KHỐI BÊN PHẢI: Search, Notification, UserCard */}
      <div className="flex items-center gap-4">
        <Input 
          placeholder="Tìm kiếm..." 
          prefix={<SearchOutlined className="text-gray-400" />} 
          className="rounded-full w-48 sm:w-64 bg-gray-50 border-gray-200 hover:border-blue-400 focus:border-blue-500 hidden md:flex"
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          allowClear
        />
        
        {/* Nút Notification */}
        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors relative">
          <Badge count={0} size="small" offset={[2, 0]}>
            <BellOutlined className="text-xl text-gray-600" />
          </Badge>
        </button>
        
        {/* UserCard Component Đồng bộ HRM */}
        <Dropdown menu={{ items: userMenu }} placement="bottomRight" trigger={['click']}>
          <button type="button" className="flex items-center gap-2 rounded-full transition hover:bg-gray-50 p-1 pr-2 border border-transparent hover:border-gray-200 bg-transparent cursor-pointer">
            <div className="hidden flex-col md:flex items-end text-right pr-1">
              {user ? (
                <>
                  <span className="font-bold text-sm text-gray-800">{user?.name}</span>
                  <span className="text-xs text-gray-500">{user?.position} {user?.department}</span>
                </>
              ) : (
                <>
                  <div className="mb-1 h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-3 w-20 bg-gray-200 animate-pulse rounded"></div>
                </>
              )}
            </div>
            <Avatar 
              src={user?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.username || 'Admin'}`} 
              size={36}
              className="bg-gray-100 border border-gray-200" 
            />
          </button>
        </Dropdown>
      </div>
    </Header>
  );
}
