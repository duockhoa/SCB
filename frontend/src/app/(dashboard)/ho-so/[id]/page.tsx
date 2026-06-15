'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useHoSoDetail } from '@/hooks/queries/useHoSo';
import { Button, Spin, Tag, Tabs, Descriptions, Empty, Space, Breadcrumb, Card } from 'antd';
import { ArrowLeftOutlined, EditOutlined, FileAddOutlined, ClockCircleOutlined, SwapOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { LOAI_HO_SO_CODE } from '@/constants/loai-ho-so';

import HoSoTaiLieuTab from '@/components/ho-so/HoSoTaiLieuTab';
import HoSoTimelineTab from '@/components/ho-so/HoSoTimelineTab';
import HoSoNhatKyTab from '@/components/ho-so/HoSoNhatKyTab';

import HoSoFormModal from '@/components/ho-so/HoSoFormModal';
import CapSoModal from '@/components/ho-so/CapSoModal';
import GiaHanModal from '@/components/ho-so/GiaHanModal';
import ThayTheModal from '@/components/ho-so/ThayTheModal';

export default function HoSoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const { data: hoSoData, isLoading, isError, refetch } = useHoSoDetail(id);

  const [openEditModal, setOpenEditModal] = useState(false);
  const [openCapSoModal, setOpenCapSoModal] = useState(false);
  const [openGiaHanModal, setOpenGiaHanModal] = useState(false);
  const [openThayTheModal, setOpenThayTheModal] = useState(false);

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;
  }

  if (isError || !hoSoData) {
    return <div style={{ padding: '50px' }}><Empty description="Không tìm thấy hồ sơ" /></div>;
  }

  const ttMa = hoSoData.tinh_trang?.ma_tinh_trang || '';

  // Xác định thông tin đặc thù
  let thong_tin_rieng: any = null;
  const dacThuKey = Object.keys(hoSoData).find(key => 
    key.startsWith('ho_so_') && 
    hoSoData[key] && 
    typeof hoSoData[key] === 'object' && 
    key !== 'ho_so_chung' && 
    key !== 'ho_so_cu'
  );
  if (dacThuKey) {
    thong_tin_rieng = hoSoData[dacThuKey];
  }

  const formatLabelFromKey = (key: string) => {
    const words = key.split('_');
    if (words.length === 0) return key;
    const first = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    return [first, ...words.slice(1)].join(' ');
  };

  // Render động Tab Đặc thù dựa theo loại hồ sơ
  const renderThongTinDacThu = () => {
    if (!thong_tin_rieng) return <Empty description="Không có thông tin đặc thù" />;

    const items = Object.entries(thong_tin_rieng)
      .filter(([k, v]) => k !== 'id' && k !== 'ho_so_chung_id' && v !== null && v !== undefined && v !== '')
      .map(([k, v], idx) => ({
        key: idx.toString(),
        label: formatLabelFromKey(k),
        children: String(v),
      }));

    return <Descriptions bordered column={1} items={items} />;
  };

  const tabItems = [
    {
      key: '1',
      label: 'Tổng quan',
      children: (
        <Card variant="borderless">
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Mã hồ sơ">{hoSoData.ma_ho_so}</Descriptions.Item>
            <Descriptions.Item label="Số công bố">{hoSoData.so_chinh || 'Chưa cấp'}</Descriptions.Item>
            <Descriptions.Item label="Tên sản phẩm">{hoSoData.ten_san_pham}</Descriptions.Item>
            <Descriptions.Item label="Loại hồ sơ">{hoSoData.loai_ho_so?.ten_loai}</Descriptions.Item>
            <Descriptions.Item label="Công ty sở hữu">{hoSoData.cong_ty_so_huu?.ten_cong_ty || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={hoSoData.tinh_trang?.mau_sac || 'default'}>{hoSoData.tinh_trang?.ten_tinh_trang || 'Mới'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày công bố/cấp">
              {hoSoData.ngay_cong_bo ? dayjs(hoSoData.ngay_cong_bo).format('DD/MM/YYYY') : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày hết hạn">
              {hoSoData.ngay_het_han ? dayjs(hoSoData.ngay_het_han).format('DD/MM/YYYY') : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày nhắc hạn" span={2}>
              {hoSoData.ngay_nhac_han ? dayjs(hoSoData.ngay_nhac_han).format('DD/MM/YYYY') : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú" span={2}>{hoSoData.ghi_chu}</Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: '2',
      label: 'Thông tin đặc thù',
      children: (
        <Card variant="borderless">
          {renderThongTinDacThu()}
        </Card>
      ),
    },
    {
      key: '3',
      label: 'Tài liệu đính kèm',
      children: (
        <Card variant="borderless">
          <HoSoTaiLieuTab hoSo={hoSoData} thongTinRieng={thong_tin_rieng} />
        </Card>
      ),
    },
    {
      key: '4',
      label: 'Timeline vòng đời',
      children: (
        <Card variant="borderless">
          <HoSoTimelineTab lichSuData={hoSoData.lich_su_thay_doi} />
        </Card>
      ),
    },
    {
      key: '5',
      label: 'Nhật ký thao tác',
      children: (
        <Card variant="borderless">
          <HoSoNhatKyTab nhatKyData={hoSoData.nhat_ky} />
        </Card>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Breadcrumb
        style={{ marginBottom: '16px' }}
        items={[
          { title: <a onClick={() => router.push('/ho-so')}>Danh sách hồ sơ</a> },
          { title: hoSoData.ma_ho_so },
        ]}
      />

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        background: '#fff',
        padding: '24px',
        borderRadius: '8px',
        marginBottom: '24px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push('/ho-so')} />
            <h1 style={{ margin: 0, fontSize: '24px' }}>{hoSoData.ten_san_pham}</h1>
            <Tag color={hoSoData.tinh_trang?.mau_sac || 'default'} style={{ fontSize: '14px', padding: '4px 8px' }}>
              {hoSoData.tinh_trang?.ten_tinh_trang || 'Khởi tạo'}
            </Tag>
          </div>
          <div style={{ color: '#666', marginLeft: '48px' }}>
            Mã HS: <strong>{hoSoData.ma_ho_so}</strong> | Số công bố: <strong>{hoSoData.so_chinh || 'Chưa có'}</strong> | Loại SP: <Tag color="blue" style={{ marginLeft: '4px' }}>{hoSoData.loai_ho_so?.ten_loai || 'N/A'}</Tag>
          </div>
        </div>

        <Space>
          <Button icon={<EditOutlined />} onClick={() => setOpenEditModal(true)}>Sửa hồ sơ</Button>
          
          {(ttMa === 'DANG_XU_LY' || !ttMa) && (
            <Button type="primary" icon={<FileAddOutlined />} onClick={() => setOpenCapSoModal(true)}>Cấp số</Button>
          )}

          {(ttMa === 'CON_HIEU_LUC' || ttMa === 'SAP_HET_HAN') && (
            <>
              <Button type="primary" style={{ background: '#722ed1' }} icon={<ClockCircleOutlined />} onClick={() => setOpenGiaHanModal(true)}>Gia hạn</Button>
              <Button type="primary" style={{ background: '#fa8c16' }} icon={<SwapOutlined />} onClick={() => setOpenThayTheModal(true)}>Thay thế</Button>
            </>
          )}
        </Space>
      </div>

      <Tabs 
        defaultActiveKey="1" 
        items={tabItems} 
        style={{ background: '#fff', padding: '0 24px 24px', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} 
      />

      {/* Modals tái sử dụng */}
      <HoSoFormModal
        mode="edit"
        open={openEditModal}
        initialData={hoSoData}
        onCancel={() => {
          setOpenEditModal(false);
          refetch(); // Reload data after edit
        }}
      />
      <CapSoModal
        open={openCapSoModal}
        hoSo={hoSoData}
        onCancel={() => {
          setOpenCapSoModal(false);
          refetch();
        }}
      />
      <GiaHanModal
        open={openGiaHanModal}
        hoSo={hoSoData}
        onCancel={() => {
          setOpenGiaHanModal(false);
          refetch();
        }}
      />
      <ThayTheModal
        open={openThayTheModal}
        hoSo={hoSoData}
        onCancel={() => {
          setOpenThayTheModal(false);
          refetch();
        }}
      />
    </div>
  );
}
