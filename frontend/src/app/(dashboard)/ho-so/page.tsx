'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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

import { Suspense } from 'react';

function HoSoMasterDetailContent() {
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

  // Resizable master pane
  const [masterWidth, setMasterWidth] = useState(35);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setMasterWidth(Math.min(Math.max(pct, 20), 60));
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  // Filter theo loại hồ sơ
  const [selectedLoaiFilter, setSelectedLoaiFilter] = useState<string[]>([]);

  const { globalSearch } = useUiStore();

  // Fetch API
  const { data: result, isLoading } = useHoSoList({ limit: 1000 });
  const allHoSo: HoSoChung[] = result?.data?.data || [];
  
  const { canCreate, canUpdate, canManage } = usePermissions();

  // Lọc theo ô tìm kiếm trên Header + loại hồ sơ
  const combinedSearch = (globalSearch || '').toLowerCase();
  const dsHoSo = allHoSo.filter((hs) => {
    // Lọc theo text search
    const matchSearch = !combinedSearch || (
      hs.ten_san_pham?.toLowerCase().includes(combinedSearch) ||
      hs.ma_ho_so?.toLowerCase().includes(combinedSearch) ||
      hs.so_chinh?.toLowerCase().includes(combinedSearch) ||
      hs.ma_san_pham_noi_bo?.toLowerCase().includes(combinedSearch)
    );
    // Lọc theo loại hồ sơ (nếu không chọn gì = hiện tất cả)
    const matchLoai = selectedLoaiFilter.length === 0 || selectedLoaiFilter.includes(hs.loai_ho_so?.ma_loai || '');
    return matchSearch && matchLoai;
  });
  
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
    // Từ điển ánh xạ key database -> Tiếng Việt có dấu chuẩn
    const dictionary: Record<string, string> = {
      // Dùng chung
      id: 'ID',
      ho_so_chung_id: 'ID hồ sơ chung',
      
      // Hồ sơ Thuốc (ho_so_thuoc)
      hoat_chat_ham_luong: 'Hoạt chất hàm lượng',
      bao_che: 'Bào chế',
      quy_cach_dong_goi: 'Quy cách đóng gói',
      dot_cap_so: 'Đợt cấp số',
      gia_han: 'Gia hạn',
      quyet_dinh_cap_sdk_url: 'Quyết định cấp SĐK',
      ke_khai_gia_url: 'Kê khai giá',
      quang_cao_url: 'Quảng cáo',
      
      // Hồ sơ Mỹ phẩm (ho_so_my_pham)
      nhan_hang: 'Nhãn hàng',
      dang_my_pham: 'Dạng mỹ phẩm',
      phieu_cong_bo_url: 'Phiếu công bố',
      hs_thay_the_ghi_chu: 'Hồ sơ thay thế / Ghi chú',
      xn_quang_cao_url: 'Xác nhận quảng cáo',
      
      // Hồ sơ Trang thiết bị y tế (ho_so_tbyt)
      ten_thuong_mai: 'Tên thương mại',
      ten_tbyt_chung_loai: 'Tên TBYT chủng loại',
      phan_loai: 'Phân loại',
      chu_so_huu: 'Chủ sở hữu',
      phieu_tiep_nhan_url: 'Phiếu tiếp nhận',
      tai_lieu_mo_ta_kt_url: 'Tài liệu mô tả kỹ thuật',
      tieu_chuan_co_so_url: 'Tiêu chuẩn cơ sở',
      nhan_url: 'Nhãn',
      hdsd_url: 'Hướng dẫn sử dụng',
      
      // Hồ sơ TPBVSK Tự công bố (ho_so_tpbvsk_tu_cong_bo)
      co_so_dung_ten: 'Cơ sở đứng tên',
      dang_san_pham: 'Dạng sản phẩm',
      
      // Hồ sơ TPBVSK Công bố (ho_so_tpbvsk_cong_bo)
      thanh_phan: 'Thành phần',
      
      // Hồ sơ CFS/CPP (ho_so_cfs_cpp)
      loai_hinh: 'Loại hình',
      nuoc_xuat_khau: 'Nước xuất khẩu',
      cong_van_cap_url: 'Công văn cấp',
    };

    if (dictionary[key]) {
      return dictionary[key];
    }

    // Fallback nếu không có trong từ điển
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
  const getLoaiHoSoColor = (maLoai?: string) => {
    switch (maLoai) {
      case 'THUOC':              return 'text-red-600 bg-red-50 border-red-200';
      case 'MY_PHAM':            return 'text-pink-600 bg-pink-50 border-pink-200';
      case 'TBYT':               return 'text-violet-600 bg-violet-50 border-violet-200';
      case 'TPBVSK_CONG_BO':     return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'TPBVSK_TU_CONG_BO':  return 'text-teal-600 bg-teal-50 border-teal-200';
      case 'CFS_CPP':            return 'text-amber-600 bg-amber-50 border-amber-200';
      default:                   return 'text-blue-500 bg-blue-50 border-blue-100';
    }
  };

  const getStatusColor = (tenTinhTrang?: string) => {
    if (!tenTinhTrang) return 'text-gray-500';
    if (tenTinhTrang.includes('Đang xử lý') || tenTinhTrang.includes('Sắp hết hạn')) return 'text-orange-500';
    if (tenTinhTrang.includes('Còn hiệu lực')) return 'text-emerald-500';
    if (tenTinhTrang.includes('Đã hết hạn') || tenTinhTrang.includes('Đã thu hồi')) return 'text-red-500';
    return 'text-gray-500';
  };

  const isDangXuLy = selectedItem?.tinh_trang?.ten_tinh_trang?.includes('Đang xử lý');
  const isConHieuLuc = selectedItem?.tinh_trang?.ten_tinh_trang?.includes('Còn hiệu lực') || selectedItem?.tinh_trang?.ten_tinh_trang?.includes('Sắp hết hạn');

  return (
    <div ref={containerRef} className="flex h-full bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 relative">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-white/80 p-6">
          <Skeleton active paragraph={{ rows: 10 }} />
        </div>
      )}

      {/* Master Pane (Left) */}
      <div className="flex flex-col border-r border-gray-200" style={{ width: selectedId ? `${masterWidth}%` : '100%', transition: isDragging.current ? 'none' : 'width 0.3s' }}>
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
        {/* Filter loại hồ sơ */}
        <div className="px-3 py-2 border-b border-gray-200 bg-white flex flex-wrap gap-1.5">
          {[
            { code: 'THUOC', label: 'Thuốc' },
            { code: 'MY_PHAM', label: 'Mỹ phẩm' },
            { code: 'TBYT', label: 'TBYT' },
            { code: 'TPBVSK_CONG_BO', label: 'TPBVSK CB' },
            { code: 'TPBVSK_TU_CONG_BO', label: 'TPBVSK TCB' },
            { code: 'CFS_CPP', label: 'CFS/CPP' },
          ].map(({ code, label }) => {
            const isActive = selectedLoaiFilter.includes(code);
            return (
              <button
                key={code}
                onClick={() => setSelectedLoaiFilter(prev =>
                  prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
                )}
                className={`text-[11px] font-semibold px-2 py-1 rounded-full border transition-all cursor-pointer ${
                  isActive ? getLoaiHoSoColor(code) + ' ring-1 ring-current' : 'text-gray-400 bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            );
          })}
          {selectedLoaiFilter.length > 0 && (
            <button
              onClick={() => setSelectedLoaiFilter([])}
              className="text-[11px] text-gray-400 hover:text-gray-600 px-1.5 py-1 cursor-pointer transition-colors"
            >
              ✕ Bỏ lọc
            </button>
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
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${getLoaiHoSoColor(item.loai_ho_so?.ma_loai)}`}>{item.loai_ho_so?.ten_loai || 'KHÁC'}</span>
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

      {/* Drag Handle */}
      {selectedId && (
        <div
          onMouseDown={handleMouseDown}
          className="w-1.5 hover:w-2 bg-transparent hover:bg-blue-400/30 cursor-col-resize transition-all flex-shrink-0 relative group"
        >
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-gray-200 group-hover:bg-blue-400 transition-colors" />
        </div>
      )}

      {/* Detail Pane (Right) */}
      {selectedId && selectedItem ? (
        <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-y-auto min-w-0">
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

export default function HoSoMasterDetail() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Đang tải cấu trúc dữ liệu...</div>}>
      <HoSoMasterDetailContent />
    </Suspense>
  );
}
