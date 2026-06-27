'use client';

import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import { Badge, Dropdown, Empty, Button, Tooltip } from 'antd';
import { useNotificationStore, type AppNotification } from '@/store/notificationStore';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

export default function HeaderNotification() {
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount());
  const router = useRouter();

  const handleClickNotification = (item: AppNotification) => {
    markAsRead(item.id);
    if (item.link) {
      router.push(item.link);
    }
  };

  const dropdownRender = () => (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-[360px] max-h-[480px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="font-bold text-base text-gray-800">Thông báo</span>
        {unreadCount > 0 && (
          <Tooltip title="Đánh dấu tất cả đã đọc">
            <Button
              type="text"
              size="small"
              icon={<CheckOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                markAllAsRead();
              }}
              className="text-gray-400 hover:text-blue-500"
            />
          </Tooltip>
        )}
      </div>

      {/* Content */}
      <div className="overflow-y-auto max-h-[400px]">
        {notifications.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Không có thông báo"
            />
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => handleClickNotification(item)}
              className={`flex flex-col gap-1 px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors hover:bg-blue-50 ${
                !item.read ? 'bg-blue-50/50' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`text-sm leading-tight ${!item.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'}`}>
                  {item.title}
                </span>
                {!item.read && (
                  <span className="mt-1.5 flex-shrink-0 h-2 w-2 rounded-full bg-blue-500"></span>
                )}
              </div>
              <span className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap">
                {item.message}
              </span>
              <span className="text-[11px] text-gray-400 mt-0.5">
                {dayjs(item.createdAt).fromNow()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <Dropdown dropdownRender={dropdownRender} placement="bottomRight" trigger={['click']}>
      <button className="p-2 rounded-full hover:bg-gray-100 transition-colors relative cursor-pointer">
        <Badge count={unreadCount} size="small" offset={[2, 0]}>
          <BellOutlined className="text-xl text-gray-600" />
        </Badge>
      </button>
    </Dropdown>
  );
}
