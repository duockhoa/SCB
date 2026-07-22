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
  icons: {
    icon: '/dkpharmalogo.png',
    shortcut: '/dkpharmalogo.png',
    apple: '/dkpharmalogo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="icon" href="/dkpharmalogo.png?v=2" type="image/png" sizes="any" />
        <link rel="shortcut icon" href="/dkpharmalogo.png?v=2" type="image/png" />
        <link rel="apple-touch-icon" href="/dkpharmalogo.png?v=2" />
      </head>
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
