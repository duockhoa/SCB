'use client';

import { useEffect } from 'react';

export default function LoginPage() {
  useEffect(() => {
    // Tự động chuyển hướng sang trang đăng nhập của HRM
    const currentUrl = encodeURIComponent(window.location.origin);
    const authUrl = process.env.NEXT_PUBLIC_FRONTEND_ROOT_URL || 'https://hrm.dkpharma.io.vn';
    window.location.href = `${authUrl}/login?redirect=${currentUrl}`;
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96 text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Đang chuyển hướng...</h1>
        <p className="text-gray-500">Vui lòng đợi, hệ thống đang chuyển bạn đến trang đăng nhập chung (HRM).</p>
      </div>
    </div>
  );
}
