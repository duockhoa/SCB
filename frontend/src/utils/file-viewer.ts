import { axiosInstance } from '@/services/api';
import { message } from 'antd';

export async function openDocumentUrl(url?: string | null) {
  if (!url) return;
  let finalUrl = url;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  if (!url.startsWith('http')) {
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    finalUrl = `${cleanBase}${cleanUrl}`;
  }

  if (finalUrl.startsWith(baseUrl)) {
    try {
      const response = await axiosInstance.get(finalUrl, {
        responseType: 'blob',
      });
      const blobUrl = window.URL.createObjectURL(response as unknown as Blob);
      window.open(blobUrl, '_blank');
    } catch (error) {
      console.error(error);
      message.error('Không thể mở tài liệu hoặc file không tồn tại');
    }
  } else {
    window.open(finalUrl, '_blank');
  }
}
