import React, { useState } from 'react';
import { Timeline, Empty, Button, Modal, Form, Input, DatePicker, Select } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface Props {
  lichSuData?: any[];
}

export default function HoSoTimelineTab({ lichSuData }: Props) {
  const [openAdd, setOpenAdd] = useState(false);
  const [form] = Form.useForm();

  // Sắp xếp lịch sử theo thời gian giảm dần (mới nhất ở trên)
  const sortedData = [...(lichSuData || [])].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleAddLichSu = () => {
    // TODO: Gọi API thêm lịch sử ở Phase sau
    alert("Tính năng Thêm lịch sử đang được phát triển ở Backend API. Tạm thời chỉ hiển thị UI để map với 15 cột Excel.");
    setOpenAdd(false);
  };

  return (
    <div style={{ padding: '12px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenAdd(true)}>
          Thêm Lịch sử / Thay đổi bổ sung
        </Button>
      </div>

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

      {/* Modal TODO: Thêm lịch sử (Chuẩn bị UI) */}
      <Modal
        title="Thêm Lịch sử / Thay đổi bổ sung"
        open={openAdd}
        onOk={handleAddLichSu}
        onCancel={() => setOpenAdd(false)}
        okText="Lưu lại"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="loai_thay_doi" label="Loại thay đổi" rules={[{ required: true }]}>
            <Select placeholder="Chọn loại thay đổi">
              <Select.Option value="THAY_DOI_NHAN">Thay đổi nhãn</Select.Option>
              <Select.Option value="THAY_DOI_CTY">Thay đổi tên công ty</Select.Option>
              <Select.Option value="THAY_DOI_NSX">Thay đổi nhà sản xuất</Select.Option>
              <Select.Option value="KHAC">Khác...</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="noi_dung_thay_doi" label="Nội dung thay đổi chi tiết">
            <Input.TextArea rows={2} placeholder="Nhập chi tiết nội dung thay đổi/bổ sung" />
          </Form.Item>

          <Form.Item name="ma_so_ngay" label="Mã số + Ngày (Quyết định/Công văn)">
            <Input placeholder="Ví dụ: 1099/TĐTN (12/11/2015)" />
          </Form.Item>

          <Form.Item name="tinh_trang" label="Tình trạng phê duyệt">
            <Select placeholder="Chọn tình trạng">
              <Select.Option value="DA_PHE_DUYET">Đã phê duyệt</Select.Option>
              <Select.Option value="CHUA_PHE_DUYET">Chưa phê duyệt</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="cong_van_url" label="Link Công văn phê duyệt" rules={[{ type: 'url', message: 'Vui lòng nhập định dạng URL hợp lệ' }]}>
            <Input placeholder="Dán link Google Drive hoặc URL công văn" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
