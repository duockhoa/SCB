import React, { useState } from 'react';
import { Timeline, Empty, Button, Modal, Form, Input, DatePicker, Select, Space, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useUpdateLichSuThayDoi, useDeleteLichSuThayDoi } from '@/hooks/queries/useHoSo';
import { useLoaiThayDoiList } from '@/hooks/queries/useDanhMuc';
import MultiUploadOrLinkInput, { parseUrls } from '../common/MultiUploadOrLinkInput';

interface Props {
  lichSuData?: any[];
}

export default function HoSoTimelineTab({ lichSuData }: Props) {
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form] = Form.useForm();
  const updateMutation = useUpdateLichSuThayDoi();
  const deleteMutation = useDeleteLichSuThayDoi();
  const { data: loaiThayDoiList } = useLoaiThayDoiList();

  // Sắp xếp lịch sử theo thời gian giảm dần (mới nhất ở trên)
  const sortedData = [...(lichSuData || [])].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const getFullUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    
    return `${cleanBase}${cleanUrl}`;
  };

  const handleEditClick = (item: any) => {
    setEditingItem(item);
    form.setFieldsValue({
      loai_thay_doi_id: item.loai_thay_doi_id,
      noi_dung_thay_doi: item.noi_dung_thay_doi,
      tinh_trang: item.tinh_trang || 'DANG_XU_LY',
      ma_so_tham_chieu: item.ma_so_tham_chieu,
      ngay_phe_duyet: item.ngay_phe_duyet ? dayjs(item.ngay_phe_duyet) : undefined,
      cong_van_url: item.cong_van_url,
      ghi_chu: item.ghi_chu,
    });
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      const payload = {
        ...values,
        ngay_phe_duyet: values.ngay_phe_duyet ? values.ngay_phe_duyet.format('YYYY-MM-DD') : undefined,
      };

      updateMutation.mutate(
        { id: editingItem.ho_so_chung_id, lichSuId: editingItem.id, data: payload },
        {
          onSuccess: () => {
            message.success('Cập nhật thay đổi thành công');
            setEditingItem(null);
            form.resetFields();
          },
          onError: (err: any) => {
            message.error(err?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật');
          }
        }
      );
    });
  };

  const handleDelete = () => {
    if (!editingItem) return;
    deleteMutation.mutate(
      { id: editingItem.ho_so_chung_id, lichSuId: editingItem.id },
      {
        onSuccess: () => {
          message.success('Đã xóa lịch sử thay đổi');
          setEditingItem(null);
          form.resetFields();
        },
        onError: (err: any) => {
          message.error(err?.response?.data?.message || 'Có lỗi xảy ra khi xóa');
        }
      }
    );
  };

  const handleModalCancel = () => {
    setEditingItem(null);
    form.resetFields();
  };

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
                <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 }}>
                  Lần thứ {item.lan_thu}: {item.loai_thay_doi?.ten_loai_thay_doi || 'Thay đổi'}
                  <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEditClick(item)} title="Cập nhật trạng thái" />
                </div>
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
                  <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {parseUrls(item.cong_van_url).map((link: any, idx: number) => (
                      <a key={idx} href={getFullUrl(link.url)} target="_blank" rel="noopener noreferrer">
                        📄 {link.name || `Xem Công văn phê duyệt ${parseUrls(item.cong_van_url).length > 1 ? idx + 1 : ''}`}
                      </a>
                    ))}
                  </div>
                )}
                {item.ghi_chu && <div style={{ color: '#888', fontStyle: 'italic', marginTop: 4 }}>Ghi chú: {item.ghi_chu}</div>}
              </div>
            ),
            color: item.lan_thu === 1 ? 'green' : 'blue',
          }))}
        />
      )}

      <Modal
        title="Cập nhật lịch sử thay đổi"
        open={!!editingItem}
        onCancel={handleModalCancel}
        footer={[
          <Popconfirm
            key="delete"
            title="Bạn có chắc chắn muốn xóa thay đổi này?"
            onConfirm={handleDelete}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} style={{ float: 'left' }} loading={deleteMutation.isPending}>
              Xóa thay đổi
            </Button>
          </Popconfirm>,
          <Button key="cancel" onClick={handleModalCancel}>
            Hủy
          </Button>,
          <Button key="submit" type="primary" loading={updateMutation.isPending} onClick={handleModalOk}>
            Cập nhật
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="loai_thay_doi_id" label="Loại thay đổi">
            <Select placeholder="Chọn loại thay đổi" allowClear>
              {loaiThayDoiList?.data?.map((item: any) => (
                <Select.Option key={item.id} value={item.id}>
                  {item.ten_loai_thay_doi}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="noi_dung_thay_doi" label="Nội dung thay đổi">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="tinh_trang" label="Trạng thái phê duyệt" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="DANG_XU_LY">Đang xử lý</Select.Option>
              <Select.Option value="DA_PHE_DUYET">Đã phê duyệt</Select.Option>
              <Select.Option value="CHUA_PHE_DUYET">Chưa phê duyệt / Từ chối</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="ma_so_tham_chieu" label="Mã số công văn/quyết định">
            <Input />
          </Form.Item>
          <Form.Item name="ngay_phe_duyet" label="Ngày phê duyệt">
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="cong_van_url" label="Link công văn đính kèm">
            <MultiUploadOrLinkInput placeholder="Nhập đường dẫn URL hoặc tải file lên" />
          </Form.Item>
          <Form.Item name="ghi_chu" label="Ghi chú">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
