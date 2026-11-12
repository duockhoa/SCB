'use client';

import { Layout, Menu, Drawer, Grid } from 'antd';
import { 
  DashboardOutlined, 
  FileTextOutlined, 
  AppstoreOutlined, 
  SettingOutlined 
} from '@ant-design/icons';
import { useUiStore } from '@/store/uiStore';
import { useRouter, usePathname } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';

const { Sider } = Layout;

export default function AppSidebar() {
  const { sidebarCollapsed, mobileMenuOpen, setMobileMenuOpen, setGlobalSearch } = useUiStore();
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;
  const router = useRouter();
  const pathname = usePathname();
  const { canConfigEmail, canViewSystemLogs, canViewDanhMuc, isDeveloper, isAdmin } = usePermissions();

  const menuItems: any[] = [
    { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/ho-so', icon: <FileTextOutlined />, label: 'Hồ Sơ Công Bố' },
    { key: '/cong-ty', icon: <AppstoreOutlined />, label: 'Quản lý Công ty' },
  ];

  // Nếu người dùng có bất kỳ quyền cấu hình nào thì hiển thị menu "Cài đặt hệ thống"
  const canAccessSettings = isDeveloper || isAdmin || canConfigEmail || canViewSystemLogs || canViewDanhMuc;
  if (canAccessSettings) {
    menuItems.push({
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt hệ thống',
    });
  }

  const handleMenuClick = ({ key }: { key: string }) => {
    setGlobalSearch('');
    if (isMobile) {
      setMobileMenuOpen(false);
    }
    router.push(key);
  };

  // Nếu đang ở bất kỳ trang con nào của /settings thì highlight mục /settings
  const selectedKey = pathname.startsWith('/settings') ? '/settings' : pathname;

  const menuElement = (
    <Menu
      theme="light"
      mode="inline"
      selectedKeys={[selectedKey]}
      items={menuItems}
      onClick={handleMenuClick}
      className="mt-2 sm:mt-4 border-r-0 font-medium"
    />
  );

  if (isMobile) {
    return (
      <Drawer
        placement="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        width={260}
        title="Hồ Sơ Công Bố"
        styles={{ body: { padding: 0 } }}
      >
        {menuElement}
      </Drawer>
    );
  }

  return (
    <Sider 
      trigger={null} 
      collapsible 
      collapsed={sidebarCollapsed} 
      theme="light" 
      width={240}
      className="border-r border-gray-200 bg-white h-[calc(100dvh-60px)] overflow-y-auto shrink-0"
    >
      {menuElement}
    </Sider>
  );
}
