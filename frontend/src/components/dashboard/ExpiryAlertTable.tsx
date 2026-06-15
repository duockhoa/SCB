import React, { useState } from 'react';
import { Table, Button, Tag, Space, Empty } from 'antd';
import { EyeOutlined, ClockCircleOutlined, SmileOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import type { HoSoChung } from '@/types/ho-so.type';
import GiaHanModal from '@/components/ho-so/GiaHanModal';

interface Props {
  data: HoSoChung[];
}

export default function ExpiryAlertTable({ data }: Props) {
  const router = useRouter();
  const [openGiaHan, setOpenGiaHan] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <span style={{ color: '#52c41a', fontWeight: 'bold', fontSize: '16px' }}>
            <SmileOutlined style={{ marginRight: 8 }} />
            Không có hồ sơ cần cảnh báo.
          </span>
        }
      />
    );
  }

  const columns = [
    {
      title: 'Mã HS / Tên sản phẩm',
      key: 'thong_tin',
      render: (record: HoSoChung) => (
        <div>
          <div style={{ fontWeight: 'bold', color: '#1890ff' }}>{record.ma_ho_so}</div>
          <div>{record.ten_san_pham}</div>
        </div>
      ),
    },
    {
      title: 'Số công bố',
      dataIndex: 'so_chinh',
      key: 'so_chinh',
      render: (text: string) => text || <span style={{ color: '#bfbfbf' }}>Chưa có</span>,
    },
    {
      title: 'Ngày hết hạn',
      dataIndex: 'ngay_het_han',
      key: 'ngay_het_han',
      render: (text: string) => <span style={{ fontWeight: 'bold' }}>{text ? dayjs(text).format('DD/MM/YYYY') : 'N/A'}</span>,
    },
    {
      title: 'Trạng thái',
      key: 'tinh_trang',
      render: (record: HoSoChung) => (
        <Tag color={record.tinh_trang?.mau_sac || 'default'}>
          {record.tinh_trang?.ten_tinh_trang}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (record: HoSoChung) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            onClick={() => router.push(`/ho-so/${record.id}`)}
          >
            Xem
          </Button>
          
          {/* Chỉ hiện nút Gia Hạn nếu Sắp hết hạn. Nếu đã hết hạn thì không cho Gia Hạn ở đây nữa (hoặc ẩn đi theo nghiệp vụ) */}
          {record.tinh_trang?.ma_tinh_trang === 'SAP_HET_HAN' && (
            <Button 
              type="primary" 
              danger 
              icon={<ClockCircleOutlined />}
              onClick={() => {
                setSelectedId(record.id);
                setOpenGiaHan(true);
              }}
            >
              Gia hạn
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={false}
      />
      {selectedId && (
        <GiaHanModal
          open={openGiaHan}
          hoSoId={selectedId}
          onCancel={() => {
            setOpenGiaHan(false);
            setSelectedId(null);
            // Table is driven by props `data` so when we close, parent might refetch
          }}
        />
      )}
    </>
  );
}
