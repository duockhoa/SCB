import React, { useState } from 'react';
import { Timeline, Empty, Button, Modal, Form, Input, DatePicker, Select, Space, message } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useUpdateLichSuThayDoi } from '@/hooks/queries/useHoSo';
import UploadOrLinkInput from '../common/UploadOrLinkInput';

interface Props {
  lichSuData?: any[];
}

export default function HoSoTimelineTab({ lichSuData }: Props) {
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form] = Form.useForm();
  const updateMutation = useUpdateLichSuThayDoi();

  // Sắp xếp lịch sử theo thời gian giảm dần (mới nhất ở trên)
  const sortedData = [...(lichSuData || [])].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleEditClick = (item: any) => {
    setEditingItem(item);
    form.setFieldsValue({
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
            message.success('Cập nhật trạng thái thành công');
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

      <Modal
        title="Cập nhật trạng thái thay đổi"
        open={!!editingItem}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={updateMutation.isPending}
        okText="Cập nhật"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
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
            <UploadOrLinkInput placeholder="Nhập đường dẫn URL hoặc tải file lên" />
          </Form.Item>
          <Form.Item name="ghi_chu" label="Ghi chú">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
