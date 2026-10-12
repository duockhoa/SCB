'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Typography } from 'antd';
import { 
  SettingOutlined, 
  UserOutlined, 
  MailOutlined, 
  HistoryOutlined, 
  DatabaseOutlined,
  SafetyCertificateOutlined 
} from '@ant-design/icons';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';

import UserSettingsTab from '@/components/settings/UserSettingsTab';
import RolesManagementTab from '@/components/settings/RolesManagementTab';
import EmailSettingsTab from '@/components/settings/EmailSettingsTab';
import LogsSettingsTab from '@/components/settings/LogsSettingsTab';
import DanhMucSettingsTab from '@/components/settings/DanhMucSettingsTab';

const { Title, Text } = Typography;

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  visible: boolean;
}

interface MenuGroup {
  groupTitle: string;
  items: MenuItem[];
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabFromUrl = searchParams.get('tab');

  const { canConfigEmail, canViewSystemLogs, canViewDanhMuc, canManageRoles, canManageUsers, isDeveloper, isAdmin } = usePermissions();

  const groups: MenuGroup[] = [
    {
      groupTitle: 'DANH MỤC CƠ SỞ',
      items: [
        {
          key: 'danh-muc',
          icon: <DatabaseOutlined className="text-lg text-emerald-500" />,
          title: 'Danh mục cơ sở',
          description: 'Loại hồ sơ, trạng thái & thông số',
          visible: canViewDanhMuc,
        },
      ],
    },
    {
      groupTitle: 'NGƯỜI DÙNG & PHÂN QUYỀN',
      items: [
        {
          key: 'users',
          icon: <UserOutlined className="text-lg text-blue-500" />,
          title: 'Người dùng & Tài khoản',
          description: 'Đồng bộ HRM & gán nhóm quyền',
          visible: Boolean(isDeveloper || isAdmin || canManageUsers),
        },
        {
          key: 'roles',
          icon: <SafetyCertificateOutlined className="text-lg text-indigo-500" />,
          title: 'Quản lý Nhóm quyền (RBAC)',
          description: 'Cấu hình phân quyền nhóm vai trò',
          visible: Boolean(isDeveloper || isAdmin || canManageRoles),
        },
      ],
    },
    {
      groupTitle: 'THÔNG BÁO & KIỂM TOÁN',
      items: [
        {
          key: 'email',
          icon: <MailOutlined className="text-lg text-amber-500" />,
          title: 'Cấu hình Email',
          description: 'Cấu hình SMTP & thông báo nhắc hạn',
          visible: canConfigEmail,
        },
        {
          key: 'logs',
          icon: <HistoryOutlined className="text-lg text-purple-500" />,
          title: 'Nhật ký Hệ thống',
          description: 'Lịch sử thao tác & kiểm toán',
          visible: canViewSystemLogs,
        },
      ],
    },
  ];

  // Lấy danh sách item hợp lệ theo quyền
  const allVisibleItems = groups.flatMap((g) => g.items).filter((i) => i.visible);
  const defaultTab = allVisibleItems[0]?.key || 'users';

  const [activeTab, setActiveTab] = useState<string>(tabFromUrl || defaultTab);

  useEffect(() => {
    if (tabFromUrl && allVisibleItems.some((i) => i.key === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    } else if (allVisibleItems.length > 0 && !allVisibleItems.some((i) => i.key === activeTab)) {
      setActiveTab(allVisibleItems[0].key);
    }
  }, [tabFromUrl, allVisibleItems, activeTab]);

  const handleSelectTab = (key: string) => {
    setActiveTab(key);
    router.replace(`/settings?tab=${key}`);
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-[#f0f2f5]">
      <div className="p-6 max-w-[1600px] mx-auto pb-16">
        {/* Tiêu đề trang */}
        <div className="mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
              <SettingOutlined className="text-xl" />
            </div>
            <div>
              <Title level={3} className="!m-0 text-gray-800 font-bold flex items-center gap-2">
                Cài đặt & Cấu hình hệ thống
              </Title>
              <Text type="secondary" className="text-sm">
                Quản lý danh mục cơ sở, cấu hình email thông báo và phân quyền người dùng.
              </Text>
            </div>
          </div>
        </div>

        {/* Bố cục 2 cột giống giao diện mẫu */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Cột trái: Danh sách các mục cấu hình */}
          <div className="w-full lg:w-80 shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm p-3 lg:sticky lg:top-4">
          {groups.map((group, gIdx) => {
            const visibleItems = group.items.filter((i) => i.visible);
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.groupTitle} className={gIdx > 0 ? 'mt-4 pt-3 border-t border-gray-100' : ''}>
                <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 tracking-wider uppercase">
                  {group.groupTitle}
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  {visibleItems.map((item) => {
                    const isActive = activeTab === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => handleSelectTab(item.key)}
                        type="button"
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                          isActive
                            ? 'bg-blue-50/80 border border-blue-200 text-blue-700 shadow-xs font-medium'
                            : 'border border-transparent text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isActive ? 'bg-white shadow-xs' : 'bg-gray-50'
                          }`}
                        >
                          {item.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div
                            className={`text-sm truncate leading-tight ${
                              isActive ? 'font-semibold text-blue-700' : 'text-gray-800 font-medium'
                            }`}
                          >
                            {item.title}
                          </div>
                          <div className="text-xs text-gray-400 truncate mt-0.5 leading-tight">
                            {item.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Cột phải: Khung nội dung tương ứng */}
        <div className="flex-1 w-full min-w-0">
          {activeTab === 'users' && <UserSettingsTab />}
          {activeTab === 'roles' && <RolesManagementTab />}
          {activeTab === 'email' && <EmailSettingsTab />}
          {activeTab === 'logs' && <LogsSettingsTab />}
          {activeTab === 'danh-muc' && <DanhMucSettingsTab />}
        </div>
      </div>
    </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Đang tải cấu hình hệ thống...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
