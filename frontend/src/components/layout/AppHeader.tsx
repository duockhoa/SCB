'use client';

import { Layout, Button, Avatar, Dropdown, Input, Badge } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, BellOutlined, SearchOutlined } from '@ant-design/icons';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

const { Header } = Layout;

export default function AppHeader() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const { logout } = useAuthStore();
  const router = useRouter();

  const userMenu = [
    { key: 'logout', label: 'Đăng xuất', onClick: () => { logout(); router.push('/login'); } },
  ];

  return (
    <Header className="h-16 px-4 bg-white border-b border-gray-200 flex items-center justify-between z-10 sticky top-0">
      <div className="flex items-center gap-4">
        <Button
          type="text"
          icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={toggleSidebar}
          className="text-lg w-10 h-10"
        />
        <div className="flex items-center gap-3">
          <div className="text-emerald-600 font-bold text-2xl tracking-tighter">
            DK<span className="text-yellow-500 text-lg">Pharma</span>
          </div>
          <div className="h-6 w-px bg-gray-300 mx-2"></div>
          <div className="text-lg font-medium text-gray-800 uppercase tracking-wide">
            HỒ SƠ CÔNG BỐ
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <Input 
          placeholder="Tìm kiếm..." 
          prefix={<SearchOutlined className="text-gray-400" />} 
          className="rounded-full w-64 bg-gray-50 border-gray-200 hover:border-emerald-400 focus:border-emerald-500"
        />
        
        <Badge count={5} size="small" className="cursor-pointer">
          <BellOutlined className="text-xl text-gray-600 hover:text-emerald-600 transition-colors" />
        </Badge>
        
        <Dropdown menu={{ items: userMenu }} placement="bottomRight" trigger={['click']}>
          <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1 pr-3 rounded-full transition-colors border border-transparent hover:border-gray-200">
            <Avatar src="https://api.dicebear.com/7.x/notionists/svg?seed=Admin" className="bg-emerald-100" />
            <div className="flex flex-col leading-tight hidden sm:flex">
              <span className="text-sm font-semibold text-gray-800">Lê Hoàng Cường</span>
              <span className="text-xs text-gray-500">Quản trị viên</span>
            </div>
          </div>
        </Dropdown>
      </div>
    </Header>
  );
}
