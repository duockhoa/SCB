'use client';

import { SearchOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import { usePathname } from 'next/navigation';
import { useRef } from 'react';
import { useUiStore } from '@/store/uiStore';

export default function HeaderSearch() {
  const ref = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const { globalSearch, setGlobalSearch } = useUiStore();

  return (
    <div className="relative hidden md:block">
      <Input
        type="text"
        placeholder="Tìm kiếm..."
        className="rounded-full w-48 focus-within:w-64 transition-all duration-300 ease-in-out bg-gray-50 border-gray-200 hover:border-blue-400 focus-within:border-blue-500 pr-8"
        prefix={<SearchOutlined className="text-gray-400" />}
        value={globalSearch}
        onChange={(e) => setGlobalSearch(e.target.value)}
        allowClear
        ref={ref as any}
      />
    </div>
  );
}
