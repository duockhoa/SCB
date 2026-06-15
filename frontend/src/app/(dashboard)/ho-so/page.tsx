'use client';

import { useState } from 'react';
import { Breadcrumb, Button, Skeleton, Dropdown, MenuProps, Popconfirm, message, Input, Descriptions, Empty, Timeline } from 'antd';
import { CloseOutlined, PlusCircleOutlined, SyncOutlined, SwapOutlined, StopOutlined, EditOutlined, DeleteOutlined, MoreOutlined, PlusOutlined, SearchOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useHoSoList, useHoSoDetail, useDeleteHoSo } from '@/hooks/queries/useHoSo';
import type { HoSoChung } from '@/types/ho-so.type';
import dayjs from 'dayjs';
import { LOAI_HO_SO_CODE } from '@/constants/loai-ho-so';

import CapSoModal from '@/components/ho-so/CapSoModal';
import GiaHanModal from '@/components/ho-so/GiaHanModal';
import ThayTheModal from '@/components/ho-so/ThayTheModal';
import HoSoFormModal from '@/components/ho-so/HoSoFormModal';

export default function HoSoMasterDetail() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  
  // Modal states
  const [capSoOpen, setCapSoOpen] = useState(false);
  const [giaHanOpen, setGiaHanOpen] = useState(false);
  const [thayTheOpen, setThayTheOpen] = useState(false);
  
  // Form CRUD states
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formOpen, setFormOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Fetch API
  const { data: result, isLoading } = useHoSoList({ limit: 1000 });
  const allHoSo: HoSoChung[] = result?.data?.data || [];
  const dsHoSo = searchText
    ? allHoSo.filter((hs) => {
        const s = searchText.toLowerCase();
        return (
          hs.ten_san_pham?.toLowerCase().includes(s) ||
          hs.ma_ho_so?.toLowerCase().includes(s) ||
          hs.so_chinh?.toLowerCase().includes(s) ||
          hs.ma_san_pham_noi_bo?.toLowerCase().includes(s)
        );
      })
    : allHoSo;
  
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
        children: String(v),
      }));

    if (items.length === 0) return null;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mt-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4 border-b pb-2">Thông tin đặc thù</h3>
        <Descriptions bordered column={1} items={items} size="small" />
      </div>
    );
  };

  const renderLichSu = () => {
    if (!currentData || !currentData.nhat_ky || currentData.nhat_ky.length === 0) return null;
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mt-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center">
          <ClockCircleOutlined className="mr-2" /> Lịch sử cập nhật
        </h3>
        <Timeline
          className="mt-4"
          items={currentData.nhat_ky.map((log: any) => ({
            color: 'blue',
            children: (
              <>
                <p className="font-medium m-0">{dayjs(log.created_at).format('DD/MM/YYYY HH:mm')}</p>
                <p className="text-gray-500 m-0">{log.noi_dung || log.hanh_dong}</p>
              </>
            ),
          }))}
        />
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

  const renderItemMenu = (item: HoSoChung) => {
    const items: MenuProps['items'] = [
      {
        key: 'view',
        label: 'Xem chi tiết',
        onClick: () => setSelectedId(item.id)
      },
      {
        key: 'edit',
        label: 'Sửa hồ sơ',
        icon: <EditOutlined />,
        onClick: () => {
          setSelectedId(item.id);
          setFormMode('edit');
          setFormOpen(true);
        }
      },
      {
        type: 'divider',
      },
      {
        key: 'delete',
        label: (
          <Popconfirm
            title="Xóa hồ sơ"
            description="Bạn có chắc chắn muốn xóa hồ sơ này không?"
            onConfirm={() => handleDelete(item.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <div className="text-red-500 w-full" onClick={(e) => e.stopPropagation()}>Xóa hồ sơ</div>
          </Popconfirm>
        ),
        icon: <DeleteOutlined className="text-red-500" />
      }
    ];

    return (
      <Dropdown menu={{ items }} trigger={['click']}>
        <Button type="text" icon={<MoreOutlined />} onClick={e => e.stopPropagation()} className="opacity-50 hover:opacity-100" />
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
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => { setFormMode('create'); setFormOpen(true); }}
            className="bg-emerald-600 hover:bg-emerald-500"
          >
            Tạo mới
          </Button>
        </div>
        <div className="p-3 border-b border-gray-100 bg-white shrink-0">
          <Input
            placeholder="Tìm kiếm theo tên, mã hồ sơ, số công bố..."
            prefix={<SearchOutlined className="text-gray-400" />}
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
            className="rounded-lg"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col">
            {dsHoSo.map((item) => (
              <div 
                key={item.id}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedId === item.id ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : 'border-l-4 border-l-transparent'}`}
                onClick={() => setSelectedId(item.id)}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="font-bold text-gray-800 text-sm w-3/4 line-clamp-1">{item.ten_san_pham}</div>
                  <div onClick={e => e.stopPropagation()}>
                    {renderItemMenu(item)}
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
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
            <Button type="text" icon={<CloseOutlined />} onClick={() => setSelectedId(null)} />
          </div>
          
          <div className="p-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center mb-6">
              <h1 className="text-3xl font-bold text-blue-600 mb-8 max-w-2xl mx-auto leading-tight">
                {selectedItem.ten_san_pham} <br/> - {selectedItem.ma_ho_so}
              </h1>
              
              {/* Circular Action Buttons */}
              <div className="flex flex-wrap justify-center gap-8 mt-10">
                {isDangXuLy && (
                  <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => setCapSoOpen(true)}>
                    <div className="w-14 h-14 rounded-full bg-blue-500 text-white flex items-center justify-center text-2xl shadow-md group-hover:-translate-y-1 transition-transform">
                      <PlusCircleOutlined />
                    </div>
                    <span className="text-xs font-medium text-gray-700 text-center w-20">Cấp Số</span>
                  </div>
                )}

                {isConHieuLuc && (
                  <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => setGiaHanOpen(true)}>
                    <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center text-2xl shadow-md group-hover:-translate-y-1 transition-transform">
                      <SyncOutlined />
                    </div>
                    <span className="text-xs font-medium text-gray-700 text-center w-20">Gia Hạn</span>
                  </div>
                )}

                <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => setThayTheOpen(true)}>
                  <div className="w-14 h-14 rounded-full bg-blue-500 text-white flex items-center justify-center text-2xl shadow-md group-hover:-translate-y-1 transition-transform">
                    <SwapOutlined />
                  </div>
                  <span className="text-xs font-medium text-gray-700 text-center w-20">Thay Thế</span>
                </div>

                <div className="flex flex-col items-center gap-2 cursor-pointer group">
                  <div className="w-14 h-14 rounded-full bg-gray-400 text-white flex items-center justify-center text-2xl shadow-md group-hover:-translate-y-1 transition-transform">
                    <StopOutlined />
                  </div>
                  <span className="text-xs font-medium text-gray-700 text-center w-20">Thu Hồi</span>
                </div>
              </div>
            </div>

            {/* Info Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="grid grid-cols-12 gap-y-4 text-sm">
                <div className="col-span-3 text-gray-500">Mã hồ sơ</div>
                <div className="col-span-9 font-medium">{selectedItem.ma_ho_so}</div>
                
                <div className="col-span-3 text-gray-500">Số công bố</div>
                <div className="col-span-9 font-medium">{selectedItem.so_chinh || 'Chưa cấp'}</div>

                <div className="col-span-3 text-gray-500">Tên sản phẩm</div>
                <div className="col-span-9 font-medium">{selectedItem.ten_san_pham}</div>

                <div className="col-span-3 text-gray-500">Loại sản phẩm công bố</div>
                <div className="col-span-9 font-medium">
                  <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-semibold">
                    {selectedItem.loai_ho_so?.ten_loai || 'N/A'}
                  </span>
                </div>
                
                <div className="col-span-3 text-gray-500">Trạng thái</div>
                <div className="col-span-9 font-medium">{selectedItem.tinh_trang?.ten_tinh_trang || 'Chưa rõ'}</div>
                
                <div className="col-span-3 text-gray-500">Ngày công bố</div>
                <div className="col-span-9 font-medium">{selectedItem.ngay_cong_bo ? dayjs(selectedItem.ngay_cong_bo).format('DD/MM/YYYY') : '-'}</div>

                <div className="col-span-3 text-gray-500">Ngày hết hạn</div>
                <div className="col-span-9 font-medium">{selectedItem.ngay_het_han ? dayjs(selectedItem.ngay_het_han).format('DD/MM/YYYY') : '-'}</div>
              </div>
            </div>

            {/* Thông tin đặc thù (nếu có) */}
            {renderThongTinDacThu()}
            {renderLichSu()}
          </div>
        </div>
      ) : null}

      {/* Action Modals */}
      {selectedItem && (
        <>
          <CapSoModal open={capSoOpen} onCancel={() => setCapSoOpen(false)} hoSo={selectedItem} />
          <GiaHanModal open={giaHanOpen} onCancel={() => setGiaHanOpen(false)} hoSo={selectedItem} />
          <ThayTheModal open={thayTheOpen} onCancel={() => setThayTheOpen(false)} hoSo={selectedItem} />
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
