'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useHoSoDetail } from '@/hooks/queries/useHoSo';
import { Button, Spin, Tag, Tabs, Descriptions, Empty, Space, Breadcrumb, Card } from 'antd';
import { ArrowLeftOutlined, EditOutlined, FileAddOutlined, ClockCircleOutlined, SwapOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { extractThongTinRieng, findFieldConfig, getFieldLabel, getLoaiHoSoAntdColor, isFileFieldKey } from '@/utils/loai-ho-so';
import { usePermissions } from '@/hooks/usePermissions';

import HoSoTaiLieuTab from '@/components/ho-so/HoSoTaiLieuTab';
import HoSoTimelineTab from '@/components/ho-so/HoSoTimelineTab';
import HoSoNhatKyTab from '@/components/ho-so/HoSoNhatKyTab';

import HoSoFormModal from '@/components/ho-so/HoSoFormModal';
import CapSoModal from '@/components/ho-so/CapSoModal';
import GiaHanModal from '@/components/ho-so/GiaHanModal';
import ThayTheModal from '@/components/ho-so/ThayTheModal';
import ThayDoiModal from '@/components/ho-so/ThayDoiModal';
import QuyDinhTamThoiModal from '@/components/ho-so/QuyDinhTamThoiModal';
import { openDocumentUrl } from '@/utils/file-viewer';

export default function HoSoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const { canUpdate, canCapSo, canGiaHan, canThayThe, canThayDoiCreate } = usePermissions();

  const { data: responseData, isLoading, isError, refetch } = useHoSoDetail(id);
  const hoSoData = responseData?.data;

  const [openEditModal, setOpenEditModal] = useState(false);
  const [openCapSoModal, setOpenCapSoModal] = useState(false);
  const [openGiaHanModal, setOpenGiaHanModal] = useState(false);
  const [openThayTheModal, setOpenThayTheModal] = useState(false);
  const [openThayDoiModal, setOpenThayDoiModal] = useState(false);
  const [openQuyDinhModal, setOpenQuyDinhModal] = useState(false);

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;
  }

  if (isError || !hoSoData) {
    return <div style={{ padding: '50px' }}><Empty description="Không tìm thấy hồ sơ" /></div>;
  }

  const ttMa = hoSoData.tinh_trang?.ma_tinh_trang || '';

  // Xác định thông tin đặc thù
  const thong_tin_rieng = extractThongTinRieng(hoSoData);

  // Render động Tab Đặc thù dựa theo loại hồ sơ
  const renderThongTinDacThu = () => {
    if (!thong_tin_rieng) return <Empty description="Không có thông tin đặc thù" />;

    const items = Object.entries(thong_tin_rieng)
      .filter(
        ([k, v]) =>
          k !== 'id' &&
          k !== 'ho_so_chung_id' &&
          !isFileFieldKey(k, hoSoData.loai_ho_so) &&
          v !== null &&
          v !== undefined &&
          v !== '',
      )
      .map(([k, v], idx) => {
        const fieldCfg = findFieldConfig(k, hoSoData.loai_ho_so);
        let children: React.ReactNode = String(v);
        if (fieldCfg?.type === 'date' && dayjs(String(v)).isValid()) {
          children = dayjs(String(v)).format('DD/MM/YYYY');
        }
        return {
          key: idx.toString(),
          label: getFieldLabel(k, hoSoData.loai_ho_so),
          children,
        };
      });

    if (items.length === 0) return <Empty description="Không có thông tin đặc thù" />;
    return <Descriptions bordered column={1} items={items} />;
  };

  const tabItems = [
    {
      key: '1',
      label: 'Tổng quan',
      children: (
        <Card variant="borderless">
          <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }} size="small">
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
              <div>
                <span>{hoSoData.ngay_het_han ? dayjs(hoSoData.ngay_het_han).format('DD/MM/YYYY') : 'N/A'}</span>
                {hoSoData.ap_dung_quy_dinh_tam_thoi && (
                  <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px' }}>
                    <Tag 
                      color="purple"
                      style={{ whiteSpace: 'normal', wordBreak: 'break-word', height: 'auto', lineHeight: '1.5', padding: '4px 8px' }}
                      title={hoSoData.ngay_het_han_quy_dinh ? `Hạn hiệu lực QĐ: ${dayjs(hoSoData.ngay_het_han_quy_dinh).format('DD/MM/YYYY')}` : undefined}
                    >
                      {hoSoData.can_cu_quy_dinh || 'Áp dụng quy định tạm thời'}
                    </Tag>
                    {hoSoData.tai_lieu_quy_dinh_url && (
                      <button 
                        type="button"
                        onClick={() => openDocumentUrl(hoSoData.tai_lieu_quy_dinh_url)} 
                        style={{ fontSize: '12px', color: '#1890ff', marginLeft: '4px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        [Xem văn bản]
                      </button>
                    )}
                  </div>
                )}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày nhắc hạn" span={{ xs: 1, md: 2 }}>
              {hoSoData.ngay_nhac_han ? dayjs(hoSoData.ngay_nhac_han).format('DD/MM/YYYY') : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú" span={{ xs: 1, md: 2 }}>{hoSoData.ghi_chu}</Descriptions.Item>
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
    <div className="h-full overflow-y-auto bg-[#f0f2f5] p-3 sm:p-4 lg:p-6">
      <Breadcrumb
        className="mb-3 sm:mb-4"
        items={[
          { title: <a onClick={() => router.push('/ho-so')}>Danh sách hồ sơ</a> },
          { title: hoSoData.ma_ho_so },
        ]}
      />

      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 bg-white p-4 sm:p-6 rounded-lg mb-4 sm:mb-6 shadow-xs">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-2">
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push('/ho-so')} />
            <h1 className="m-0 text-lg sm:text-2xl font-bold break-words">{hoSoData.ten_san_pham}</h1>
            <Tag color={hoSoData.tinh_trang?.mau_sac || 'default'} className="text-xs sm:text-sm px-2 py-0.5">
              {hoSoData.tinh_trang?.ten_tinh_trang || 'Khởi tạo'}
            </Tag>
          </div>
          <div className="text-gray-600 ml-0 sm:ml-11 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm">
            <span>Mã HS: <strong>{hoSoData.ma_ho_so}</strong></span>
            <span className="hidden sm:inline">|</span>
            <span>Số công bố: <strong>{hoSoData.so_chinh || 'Chưa có'}</strong></span>
            <span className="hidden sm:inline">|</span>
            <span>Loại SP: <Tag color={getLoaiHoSoAntdColor(hoSoData.loai_ho_so?.ma_loai, hoSoData.loai_ho_so?.mau_sac)} className="ml-1">{hoSoData.loai_ho_so?.ten_loai || 'N/A'}</Tag></span>
          </div>
        </div>

        <Space wrap size="small">
          {canUpdate && (
            <Button icon={<EditOutlined />} onClick={() => setOpenEditModal(true)}>Sửa hồ sơ</Button>
          )}
          
          {(ttMa === 'DANG_XU_LY' || !ttMa) && (canCapSo || canUpdate) && (
            <Button type="primary" icon={<FileAddOutlined />} onClick={() => setOpenCapSoModal(true)}>Cấp số</Button>
          )}

          {(ttMa === 'CON_HIEU_LUC' || ttMa === 'SAP_HET_HAN') && (
            <>
              {(canGiaHan || canUpdate) && (
                <Button type="primary" style={{ background: '#722ed1' }} icon={<ClockCircleOutlined />} onClick={() => setOpenGiaHanModal(true)}>Gia hạn</Button>
              )}
              {(canThayThe || canUpdate) && (
                <Button type="primary" style={{ background: '#fa8c16' }} icon={<SwapOutlined />} onClick={() => setOpenThayTheModal(true)}>Thay thế</Button>
              )}
            </>
          )}
          
          {canUpdate && (
            <Button 
              style={{ borderColor: '#722ed1', color: '#722ed1' }} 
              icon={<SafetyCertificateOutlined />} 
              onClick={() => setOpenQuyDinhModal(true)}
            >
              QĐ Tạm Thời
            </Button>
          )}
          
          {canThayDoiCreate && (
            <Button icon={<FileAddOutlined />} onClick={() => setOpenThayDoiModal(true)}>Thêm thay đổi</Button>
          )}
        </Space>
      </div>

      <Tabs 
        defaultActiveKey="1" 
        items={tabItems} 
        className="bg-white px-3 sm:px-6 pb-4 sm:pb-6 rounded-lg shadow-xs"
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
      <QuyDinhTamThoiModal
        open={openQuyDinhModal}
        hoSo={hoSoData}
        onCancel={() => {
          setOpenQuyDinhModal(false);
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
      <ThayDoiModal
        open={openThayDoiModal}
        hoSo={hoSoData}
        onCancel={() => {
          setOpenThayDoiModal(false);
          refetch();
        }}
      />
    </div>
  );
}
