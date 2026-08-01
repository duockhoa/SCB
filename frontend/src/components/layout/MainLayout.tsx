'use client';

import { Layout, Modal, Spin } from 'antd';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';

const { Content } = Layout;

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, hasScbAccess, fetchUser } = useAuthStore();

  useEffect(() => {
    if (user === null) {
      fetchUser();
    }
  }, [user, fetchUser]);

  useEffect(() => {
    if (hasScbAccess === false) {
      Modal.error({
        title: 'Truy cập bị từ chối',
        content: 'Bạn không có quyền truy cập ứng dụng này',
        okText: 'OK',
        keyboard: false,
        maskClosable: false,
        onOk: () => {
          const hrmUrl = process.env.NEXT_PUBLIC_FRONTEND_ROOT_URL || 'https://hrm.dkpharma.io.vn';
          window.location.href = hrmUrl;
        }
      });
    }
  }, [hasScbAccess]);

  if (hasScbAccess === null) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f0f2f5]">
        <Spin size="large" tip="Đang kiểm tra quyền truy cập..." />
      </div>
    );
  }

  if (hasScbAccess === false) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f0f2f5]">
        <Spin size="large" tip="Đang chuyển hướng..." />
      </div>
    );
  }

  return (
    <Layout className="min-h-screen">
      <AppHeader />
      <Layout>
        <AppSidebar />
        <Content className="bg-[#f0f2f5] flex flex-col h-[calc(100vh-64px)] overflow-hidden">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
