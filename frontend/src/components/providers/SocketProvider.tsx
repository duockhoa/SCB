'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';
import { notification } from 'antd';
import { API_URL } from '@/constants/endpoints';
import dayjs from 'dayjs';
import { useNotificationStore } from '@/store/notificationStore';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    const token = Cookies.get('accessToken');
    if (!token) return;

    // Connect to WebSocket server. 
    // Assuming API_URL is something like http://localhost:3000/api 
    // We need the root host for Socket.IO. We can just use the base API_URL origin if valid.
    const socketUrl = new URL(API_URL).origin;

    const socketInstance = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    });

    socketInstance.on('profileUpdated', (data: any) => {
      const { ma_ho_so, ten_san_pham, action, time, tinh_trang, noi_dung } = data;
      
      let message = 'Cập nhật hồ sơ';
      let description = `Hồ sơ ${ma_ho_so} - ${ten_san_pham} vừa được cập nhật.`;

      if (action === 'THAY_DOI') {
        message = 'Có thay đổi mới trên hồ sơ';
        description = `Hồ sơ ${ma_ho_so} vừa có cập nhật: ${noi_dung || 'N/A'}.`;
      } else if (action === 'UPDATE_LICH_SU') {
        message = 'Cập nhật trạng thái thay đổi';
        description = `Hồ sơ ${ma_ho_so} vừa được cập nhật lịch sử thay đổi.`;
      }

      description += `\nThời gian: ${dayjs(time).format('DD/MM/YYYY HH:mm:ss')}`;

      // 1. Toast popup (giữ nguyên)
      api.info({
        message,
        description: <span style={{ whiteSpace: 'pre-wrap' }}>{description}</span>,
        placement: 'topRight',
        duration: 5,
      });

      // 2. Lưu vào notification store (cho bell icon)
      useNotificationStore.getState().addNotification({
        title: message,
        message: description,
        maHoSo: ma_ho_so,
        link: ma_ho_so ? `/ho-so/${data.hoSoId || ''}` : undefined,
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [api]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {contextHolder}
      {children}
    </SocketContext.Provider>
  );
};
