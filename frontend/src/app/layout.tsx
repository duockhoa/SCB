import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import QueryProvider from '@/components/providers/QueryProvider';
import { SocketProvider } from '@/components/providers/SocketProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Quản Lý Hồ Sơ CB',
  description: 'Hệ thống quản lý số công bố sản phẩm SCB',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <QueryProvider>
          <SocketProvider>
            <AntdRegistry>
            <ConfigProvider
              theme={{
                token: {
                  colorPrimary: '#10b981', // Emerald 500
                  borderRadius: 6,
                  colorBgContainer: '#ffffff',
                },
                components: {
                  Menu: {
                    itemSelectedBg: '#ecfdf5', // Emerald 50
                    itemSelectedColor: '#047857', // Emerald 700
                    itemHoverBg: '#f0fdf4',
                  },
                }
              }}
            >
              {children}
            </ConfigProvider>
          </AntdRegistry>
          </SocketProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
