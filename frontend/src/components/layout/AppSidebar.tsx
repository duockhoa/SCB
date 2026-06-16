'use client';

import { Layout, Menu } from 'antd';
import { DashboardOutlined, FileTextOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useUiStore } from '@/store/uiStore';
import { useRouter, usePathname } from 'next/navigation';

const { Sider } = Layout;

export default function AppSidebar() {
  const { sidebarCollapsed } = useUiStore();
  const { setGlobalSearch } = useUiStore();
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/ho-so', icon: <FileTextOutlined />, label: 'Hồ Sơ Công Bố' },
    { key: '/cong-ty', icon: <AppstoreOutlined />, label: 'Quản lý Công ty' },
    { key: '/danh-muc', icon: <AppstoreOutlined />, label: 'Danh Mục' },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    setGlobalSearch('');
    router.push(key);
  };

  return (
    <Sider 
      trigger={null} 
      collapsible 
      collapsed={sidebarCollapsed} 
      theme="light" 
      width={260}
      className="border-r border-gray-200 bg-white h-[calc(100vh-64px)] overflow-y-auto"
    >
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[pathname === '/' ? '/' : pathname.startsWith('/ho-so') ? '/ho-so' : '']}
        items={menuItems}
        onClick={handleMenuClick}
        className="mt-4 border-r-0 font-medium"
      />
    </Sider>
  );
}
