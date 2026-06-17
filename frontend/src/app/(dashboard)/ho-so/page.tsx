'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Breadcrumb, Button, Skeleton, Dropdown, MenuProps, Popconfirm, message, Input, Descriptions, Empty, Timeline } from 'antd';
import { CloseOutlined, PlusCircleOutlined, SyncOutlined, SwapOutlined, StopOutlined, EditOutlined, DeleteOutlined, MoreOutlined, PlusOutlined, SearchOutlined, ClockCircleOutlined, FileAddOutlined } from '@ant-design/icons';
import { useHoSoList, useHoSoDetail, useDeleteHoSo } from '@/hooks/queries/useHoSo';
import type { HoSoChung } from '@/types/ho-so.type';
import dayjs from 'dayjs';
import { LOAI_HO_SO_CODE } from '@/constants/loai-ho-so';
import { useUiStore } from '@/store/uiStore';

import CapSoModal from '@/components/ho-so/CapSoModal';
import GiaHanModal from '@/components/ho-so/GiaHanModal';
import ThayTheModal from '@/components/ho-so/ThayTheModal';
import ThayDoiModal from '@/components/ho-so/ThayDoiModal';
import HoSoFormModal from '@/components/ho-so/HoSoFormModal';
import HoSoTaiLieuTab from '@/components/ho-so/HoSoTaiLieuTab';
import HoSoTimelineTab from '@/components/ho-so/HoSoTimelineTab';
import HoSoNhatKyTab from '@/components/ho-so/HoSoNhatKyTab';
import { Card } from 'antd';
import { usePermissions } from '@/hooks/usePermissions';

export default function HoSoMasterDetail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idFromUrl = searchParams.get('id');
  const [selectedId, setSelectedId] = useState<number | null>(idFromUrl ? Number(idFromUrl) : null);
  
  // Modal states
  const [capSoOpen, setCapSoOpen] = useState(false);
  const [giaHanOpen, setGiaHanOpen] = useState(false);
  const [thayTheOpen, setThayTheOpen] = useState(false);
  const [thayDoiOpen, setThayDoiOpen] = useState(false);
  
  // Form CRUD states
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formOpen, setFormOpen] = useState(false);

  const { globalSearch } = useUiStore();

  // Fetch API
  const { data: result, isLoading } = useHoSoList({ limit: 1000 });
  const allHoSo: HoSoChung[] = result?.data?.data || [];
  
  const { canCreate, canUpdate, canManage } = usePermissions();

  // Lọc theo ô tìm kiếm trên Header
  const combinedSearch = (globalSearch || '').toLowerCase();
  const dsHoSo = combinedSearch
    ? allHoSo.filter((hs) => {
        return (
          hs.ten_san_pham?.toLowerCase().includes(combinedSearch) ||
          hs.ma_ho_so?.toLowerCase().includes(combinedSearch) ||
          hs.so_chinh?.toLowerCase().includes(combinedSearch) ||
          hs.ma_san_pham_noi_bo?.toLowerCase().includes(combinedSearch)
        );
      })
    : allHoSo;
  
  // Bỏ tính năng tự động chọn item đầu tiên theo yêu cầu của user
  // useEffect(() => {
  //   if (dsHoSo.length > 0 && !selectedId && !isLoading) {
  //     setSelectedId(dsHoSo[0].id);
  //   }
  // }, [dsHoSo, selectedId, isLoading]);
  
  const { mutate: deleteHoSo } = useDeleteHoSo();

  const selectedItem = dsHoSo.find(item => item.id === selectedId);
  const { data: detailData, isLoading: isLoadingDetail } = useHoSoDetail(selectedId as number);

  // Xác định thông tin đặc thù cho hồ sơ đang chọn từ API detail
  let thong_tin_rieng: any = null;
  const currentData = detailData?.data || selectedItem;

  if (currentData) {
    const dacThuKey = Object.keys(currentData).find(key => 
      key.startsWith('ho_so_') && 
      currentData[key] && 
      typeof currentData[key] === 'object' && 
      key !== 'ho_so_chung' && 
      key !== 'ho_so_cu'
    );
    if (dacThuKey) {
      thong_tin_rieng = currentData[dacThuKey];
    }
  }

  const formatLabelFromKey = (key: string) => {
    const words = key.split('_');
    if (words.length === 0) return key;
    const first = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    return [first, ...words.slice(1)].join(' ');
  };

  const renderThongTinDacThu = () => {
    if (!currentData || !thong_tin_rieng) return null;

    if (isLoadingDetail) {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mt-6 text-center">
          <Skeleton active paragraph={{ rows: 3 }} />
        </div>
      );
    }

    const items = Object.entries(thong_tin_rieng)
      .filter(([k, v]) => k !== 'id' && k !== 'ho_so_chung_id' && v !== null && v !== undefined && v !== '')
      .map(([k, v], idx) => ({
        key: idx.toString(),
        label: formatLabelFromKey(k),
        value: String(v),
      }));

    if (items.length === 0) return null;

    return (
      <div className="flex flex-col gap-y-4 text-sm px-2">
        {items.map((item) => (
          <div key={item.key} className="grid grid-cols-12 gap-4">
            <div className="col-span-4 text-gray-500">{item.label}</div>
            <div className="col-span-8 font-medium text-gray-800">{item.value}</div>
          </div>
        ))}
      </div>
    );
  };

  const handleDelete = (id: number) => {
    deleteHoSo(id, {
      onSuccess: () => {
        message.success('Xóa hồ sơ thành công');
        if (selectedId === id) setSelectedId(null);
      },
      onError: (err: any) => message.error(err.response?.data?.message || 'Không thể xóa')
    });
  };

  const handleEdit = (item: HoSoChung) => {
    setSelectedId(item.id);
    setFormMode('edit');
    setFormOpen(true);
  };

  const renderItemMenu = (item: HoSoChung) => {
    if (!canManage) return null;

    const menuItems: MenuProps['items'] = [
      {
        key: 'edit',
        icon: <EditOutlined className="text-blue-500" />,
        label: 'Sửa hồ sơ',
        onClick: () => handleEdit(item),
      },
      {
        key: 'delete',
        icon: <DeleteOutlined className="text-red-500" />,
        label: (
          <Popconfirm
            title="Xóa hồ sơ"
            description="Bạn có chắc chắn muốn xóa hồ sơ này không?"
            onConfirm={() => handleDelete(item.id)}
            okText="Đồng ý"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <span className="text-red-500">Xóa hồ sơ</span>
          </Popconfirm>
        ),
      },
    ];

    return (
      <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
        <Button type="text" icon={<MoreOutlined />} size="small" className="text-gray-400 hover:text-gray-600" />
      </Dropdown>
    );
  };

  // Helper functions cho UI
  const getStatusColor = (tenTinhTrang?: string) => {
    if (!tenTinhTrang) return 'text-gray-500';
    if (tenTinhTrang.includes('Đang xử lý') || tenTinhTrang.includes('Sắp hết hạn')) return 'text-orange-500';
    if (tenTinhTrang.includes('Còn hiệu lực')) return 'text-emerald-500';
    if (tenTinhTrang.includes('Đã hết hạn') || tenTinhTrang.includes('Bị thu hồi')) return 'text-red-500';
    return 'text-gray-500';
  };

  const isDangXuLy = selectedItem?.tinh_trang?.ten_tinh_trang?.includes('Đang xử lý');
  const isConHieuLuc = selectedItem?.tinh_trang?.ten_tinh_trang?.includes('Còn hiệu lực') || selectedItem?.tinh_trang?.ten_tinh_trang?.includes('Sắp hết hạn');

  return (
    <div className="flex h-full bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 relative">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-white/80 p-6">
          <Skeleton active paragraph={{ rows: 10 }} />
        </div>
      )}

      {/* Master Pane (Left) */}
      <div className={`flex flex-col border-r border-gray-200 transition-all duration-300 ${selectedId ? 'w-[35%]' : 'w-full'}`}>
        <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <span className="font-semibold text-gray-700">{selectedId ? '> Danh sách Hồ sơ' : 'Danh sách Hồ sơ'}</span>
          {canCreate && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => { setFormMode('create'); setFormOpen(true); }}
              className="bg-blue-600 hover:bg-blue-500"
            >
              Tạo mới
            </Button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col">
            {dsHoSo.map((item) => (
              <div 
                key={item.id}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors ${selectedId === item.id ? 'bg-[#e6f7ff] border-l-4 border-blue-500' : 'border-l-4 border-transparent'}`}
                onClick={() => {
                  setSelectedId(item.id);
                  window.history.pushState(null, '', `?id=${item.id}`);
                }}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className={`font-bold text-sm w-3/4 line-clamp-2 ${selectedId === item.id ? 'text-blue-600' : 'text-gray-800'}`}>
                    {item.ten_san_pham}
                  </div>
                  <div onClick={e => e.stopPropagation()}>
                    {renderItemMenu(item)}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] uppercase font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{item.loai_ho_so?.ten_loai || 'KHÁC'}</span>
                </div>
                <div className="flex justify-between items-center mt-1.5">
                  <span className="text-gray-500 text-sm">{item.ma_ho_so}</span>
                  <span className={`text-xs font-semibold ${getStatusColor(item.tinh_trang?.ten_tinh_trang)}`}>
                    {item.tinh_trang?.ten_tinh_trang || 'Chưa rõ'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Pane (Right) */}
      {selectedId && selectedItem ? (
        <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
            <Breadcrumb items={[{ title: 'Hồ sơ công bố' }, { title: `${selectedItem.ma_ho_so}` }]} />
            <Button type="text" icon={<CloseOutlined />} onClick={() => {
              setSelectedId(null);
              window.history.pushState(null, '', '/ho-so');
            }} />
          </div>
          
          <div className="p-6">
            {/* Card 1: Tiêu đề + Nút thao tác */}
            <div style={{ marginBottom: 24 }}>
              <Card style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>
                <div className="text-center pt-2">
                  <h1 className="text-2xl font-bold text-blue-600 mb-6">
                    {selectedItem.ten_san_pham} - {selectedItem.ma_ho_so}
                  </h1>
                  
                  <div className="flex flex-wrap justify-center gap-8 mb-4">
                    {canUpdate && isDangXuLy && (
                      <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => setCapSoOpen(true)}>
                        <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl shadow-md group-hover:-translate-y-1 transition-transform">
                          <PlusCircleOutlined />
                        </div>
                        <span className="text-xs font-medium text-gray-700 text-center w-20 leading-tight">Cấp Số</span>
                      </div>
                    )}

                    {canUpdate && isConHieuLuc && (
                      <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => setGiaHanOpen(true)}>
                        <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl shadow-md group-hover:-translate-y-1 transition-transform">
                          <SyncOutlined />
                        </div>
                        <span className="text-xs font-medium text-gray-700 text-center w-20 leading-tight">Gia Hạn</span>
                      </div>
                    )}

                    {canManage && (
                      <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => setThayTheOpen(true)}>
                        <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl shadow-md group-hover:-translate-y-1 transition-transform">
                          <SwapOutlined />
                        </div>
                        <span className="text-xs font-medium text-gray-700 text-center w-20 leading-tight">Thay Thế</span>
                      </div>
                    )}

                    {canUpdate && (
                      <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => setThayDoiOpen(true)}>
                        <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl shadow-md group-hover:-translate-y-1 transition-transform">
                          <FileAddOutlined />
                        </div>
                        <span className="text-xs font-medium text-gray-700 text-center w-20 leading-tight">Thêm Thay Đổi</span>
                      </div>
                    )}

                    {canManage && (
                      <div className="flex flex-col items-center gap-2 cursor-pointer group">
                        <div className="w-12 h-12 rounded-full bg-gray-400 text-white flex items-center justify-center text-xl shadow-md group-hover:-translate-y-1 transition-transform">
                          <StopOutlined />
                        </div>
                        <span className="text-xs font-medium text-gray-700 text-center w-20 leading-tight">Thu Hồi</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Card 2: Thông tin tổng quan */}
            <div style={{ marginBottom: 24 }}>
              <Card style={{ border: '1px solid #e5e7eb', borderRadius: 8 }} title="Thông tin tổng quan">
                <div className="flex flex-col gap-y-5 text-sm px-4">
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-3 text-gray-500">Mã hồ sơ</div>
                    <div className="col-span-9 text-gray-800">{currentData?.ma_ho_so}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-3 text-gray-500">Số công bố</div>
                    <div className="col-span-9 text-gray-800">{currentData?.so_chinh || 'Chưa cấp'}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-3 text-gray-500">Tên sản phẩm</div>
                    <div className="col-span-9 text-gray-800">{currentData?.ten_san_pham}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-3 text-gray-500">Loại sản phẩm</div>
                    <div className="col-span-9 text-gray-800">{currentData?.loai_ho_so?.ten_loai || 'N/A'}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-3 text-gray-500">Trạng thái</div>
                    <div className="col-span-9 text-gray-800">{currentData?.tinh_trang?.ten_tinh_trang || 'Chưa rõ'}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-3 text-gray-500">Ngày công bố/cấp</div>
                    <div className="col-span-9 text-gray-800">{currentData?.ngay_cong_bo ? dayjs(currentData.ngay_cong_bo).format('DD/MM/YYYY') : '-'}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-3 text-gray-500">Ngày hết hạn</div>
                    <div className="col-span-9 text-gray-800">{currentData?.ngay_het_han ? dayjs(currentData.ngay_het_han).format('DD/MM/YYYY') : '-'}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-3 text-gray-500">Ghi chú</div>
                    <div className="col-span-9 text-gray-800">{currentData?.ghi_chu || '-'}</div>
                  </div>
                </div>
              </Card>
            </div>

            <div style={{ marginBottom: 24 }}>
              <Card style={{ border: '1px solid #e5e7eb', borderRadius: 8 }} title="Thông tin chi tiết">
                {renderThongTinDacThu()}
              </Card>
            </div>

            <div style={{ marginBottom: 24 }}>
              <Card style={{ border: '1px solid #e5e7eb', borderRadius: 8 }} title="Tài liệu đính kèm">
                <HoSoTaiLieuTab hoSo={currentData} thongTinRieng={thong_tin_rieng} />
              </Card>
            </div>

            <div style={{ marginBottom: 24 }}>
              <Card style={{ border: '1px solid #e5e7eb', borderRadius: 8 }} title="Timeline vòng đời">
                {currentData?.lich_su_thay_doi ? <HoSoTimelineTab lichSuData={currentData.lich_su_thay_doi} /> : <Empty description="Chưa có dữ liệu" />}
              </Card>
            </div>

            <div style={{ marginBottom: 24 }}>
              <Card style={{ border: '1px solid #e5e7eb', borderRadius: 8 }} title="Nhật ký thao tác">
                {currentData?.nhat_ky ? <HoSoNhatKyTab nhatKyData={currentData.nhat_ky} /> : <Empty description="Chưa có dữ liệu" />}
              </Card>
            </div>
          </div>
        </div>
      ) : null}

      {/* Action Modals */}
      {selectedItem && (
        <>
          <CapSoModal open={capSoOpen} onCancel={() => setCapSoOpen(false)} hoSo={selectedItem} />
          <GiaHanModal open={giaHanOpen} onCancel={() => setGiaHanOpen(false)} hoSo={selectedItem} />
          <ThayTheModal open={thayTheOpen} onCancel={() => setThayTheOpen(false)} hoSo={selectedItem} />
          <ThayDoiModal open={thayDoiOpen} onCancel={() => setThayDoiOpen(false)} hoSo={selectedItem} />
        </>
      )}

      {/* CRUD Modal */}
      <HoSoFormModal 
        mode={formMode} 
        open={formOpen} 
        onCancel={() => setFormOpen(false)} 
        initialData={formMode === 'edit' ? selectedItem : undefined} 
      />
    </div>
  );
}
