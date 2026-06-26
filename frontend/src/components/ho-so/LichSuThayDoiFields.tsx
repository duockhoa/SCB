import React from 'react';
import { Form, Input, InputNumber, DatePicker, Select, Divider } from 'antd';
import MultiUploadOrLinkInput from '../common/MultiUploadOrLinkInput';

interface Props {
  title?: string;
}

export default function LichSuThayDoiFields({ title = "Thông tin Lịch sử / Thay đổi" }: Props) {
  return (
    <>
      <Divider >{title}</Divider>
      
      <div className="grid grid-cols-2 gap-x-4">
        <Form.Item name="lan_thu" label="Lần thay đổi thứ">
          <InputNumber min={1} style={{ width: '100%' }} placeholder="Tự động nếu để trống" />
        </Form.Item>

        <Form.Item name="ngay_thay_doi" label="Ngày thay đổi / phê duyệt">
          <DatePicker className="w-full" format="DD/MM/YYYY" />
        </Form.Item>
      </div>

      <Form.Item name="noi_dung_thay_doi" label="Nội dung thay đổi chi tiết">
        <Input.TextArea rows={2} placeholder="Nhập chi tiết nội dung thay đổi/bổ sung" />
      </Form.Item>

      <div className="grid grid-cols-2 gap-x-4">
        <Form.Item name="ma_so_tham_chieu" label="Mã số (Quyết định/Công văn)">
          <Input placeholder="Ví dụ: 1099/TĐTN" />
        </Form.Item>

        <Form.Item name="ngay_phe_duyet" label="Ngày (Quyết định/Công văn)">
          <DatePicker className="w-full" format="DD/MM/YYYY" />
        </Form.Item>
      </div>

      <Form.Item name="tinh_trang" label="Tình trạng phê duyệt">
        <Select placeholder="Chọn tình trạng">
          <Select.Option value="DA_PHE_DUYET">Đã phê duyệt</Select.Option>
          <Select.Option value="CHUA_PHE_DUYET">Chưa phê duyệt</Select.Option>
          <Select.Option value="DANG_XU_LY">Đang xử lý</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item name="cong_van_url" label="Link Công văn phê duyệt / File đính kèm">
        <MultiUploadOrLinkInput placeholder="Dán link hoặc tải file đính kèm lên" />
      </Form.Item>

      <Form.Item name="ghi_chu" label="Ghi chú thêm">
        <Input.TextArea rows={2} placeholder="Ghi chú" />
      </Form.Item>
    </>
  );
}
