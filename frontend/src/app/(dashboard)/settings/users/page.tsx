'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UsersRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings?tab=users');
  }, [router]);

  return (
    <div className="p-8 text-center text-gray-500">
      Đang chuyển tiếp tới Cài đặt hệ thống...
    </div>
  );
}
