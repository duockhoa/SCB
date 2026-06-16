import React, { useState } from 'react';
import { Timeline, Empty, Button, Modal, Form, Input, DatePicker, Select } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface Props {
  lichSuData?: any[];
}

export default function HoSoTimelineTab({ lichSuData }: Props) {
  // Sắp xếp lịch sử theo thời gian giảm dần (mới nhất ở trên)
  const sortedData = [...(lichSuData || [])].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div style={{ padding: '12px 0' }}>
      {!lichSuData || lichSuData.length === 0 ? (
        <Empty description="Chưa có lịch sử thay đổi nào" />
      ) : (
        <Timeline
          mode="left"
          items={sortedData.map((item) => ({
            label: dayjs(item.created_at).format('DD/MM/YYYY HH:mm'),
            children: (
              <div>
                <div style={{ fontWeight: 'bold' }}>Lần thứ {item.lan_thu}: {item.loai_thay_doi?.ten_loai_thay_doi || 'Thay đổi'}</div>
                <div>{item.noi_dung_thay_doi}</div>
                {(item.ma_so_tham_chieu || item.ngay_phe_duyet) && (
                  <div style={{ color: '#555', marginTop: 4 }}>
                    Mã số: <strong>{item.ma_so_tham_chieu || 'N/A'}</strong>
                    {item.ngay_phe_duyet && ` | Ngày phê duyệt: ${dayjs(item.ngay_phe_duyet).format('DD/MM/YYYY')}`}
                  </div>
                )}
                {item.tinh_trang && (
                  <div style={{ marginTop: 4 }}>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${item.tinh_trang === 'DA_PHE_DUYET' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {item.tinh_trang === 'DA_PHE_DUYET' ? 'Đã phê duyệt' : item.tinh_trang === 'CHUA_PHE_DUYET' ? 'Chưa phê duyệt' : 'Đang xử lý'}
                    </span>
                  </div>
                )}
                {item.cong_van_url && (
                  <div style={{ marginTop: 4 }}>
                    <a href={item.cong_van_url} target="_blank" rel="noopener noreferrer">
                      📄 Xem Công văn phê duyệt
                    </a>
                  </div>
                )}
                {item.ghi_chu && <div style={{ color: '#888', fontStyle: 'italic', marginTop: 4 }}>Ghi chú: {item.ghi_chu}</div>}
              </div>
            ),
            color: item.lan_thu === 1 ? 'green' : 'blue',
          }))}
        />
      )}

      {/* Removed old modal */}
    </div>
  );
}
