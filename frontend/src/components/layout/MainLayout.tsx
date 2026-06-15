'use client';

import { Layout } from 'antd';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';

const { Content } = Layout;

export default function MainLayout({ children }: { children: React.ReactNode }) {
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
