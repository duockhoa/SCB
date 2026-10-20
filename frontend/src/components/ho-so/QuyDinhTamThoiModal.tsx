import React, { useEffect } from 'react';
import { Modal, Form, DatePicker, Input, Switch, Alert, message, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import { useApDungQuyDinh } from '@/hooks/queries/useHoSo';
import type { HoSoChung } from '@/types/ho-so.type';
import { SafetyCertificateOutlined, InfoCircleOutlined } from '@ant-design/icons';
import UploadOrLinkInput from '../common/UploadOrLinkInput';

const { Text } = Typography;

interface Props {
  open: boolean;
  onCancel: () => void;
  hoSo: HoSoChung;
}

export default function QuyDinhTamThoiModal({ open, onCancel, hoSo }: Props) {
  const [form] = Form.useForm();
  const { mutate: apDungQuyDinh, isPending } = useApDungQuyDinh();
  const isApDungWatch = Form.useWatch('ap_dung_quy_dinh_tam_thoi', form);

  useEffect(() => {
    if (open && hoSo) {
      form.setFieldsValue({
        ap_dung_quy_dinh_tam_thoi: hoSo.ap_dung_quy_dinh_tam_thoi ?? false,
        ngay_het_han_quy_dinh: hoSo.ngay_het_han_quy_dinh ? dayjs(hoSo.ngay_het_han_quy_dinh) : null,
        can_cu_quy_dinh: hoSo.can_cu_quy_dinh || '',
        tai_lieu_quy_dinh_url: hoSo.tai_lieu_quy_dinh_url || '',
        ghi_chu: '',
      });
    }
  }, [open, hoSo, form]);

  const handleFinish = (values: any) => {
    const payload = {
      ap_dung_quy_dinh_tam_thoi: values.ap_dung_quy_dinh_tam_thoi,
      ngay_het_han_quy_dinh: values.ap_dung_quy_dinh_tam_thoi && values.ngay_het_han_quy_dinh
        ? values.ngay_het_han_quy_dinh.format('YYYY-MM-DD')
        : null,
      can_cu_quy_dinh: values.ap_dung_quy_dinh_tam_thoi ? values.can_cu_quy_dinh : null,
      tai_lieu_quy_dinh_url: values.ap_dung_quy_dinh_tam_thoi ? values.tai_lieu_quy_dinh_url : null,
      ghi_chu: values.ghi_chu || undefined,
    };

    apDungQuyDinh({ id: hoSo.id, data: payload }, {
      onSuccess: () => {
        message.success(
          payload.ap_dung_quy_dinh_tam_thoi
            ? 'Đã áp dụng quy định tạm thời duy trì hiệu lực hồ sơ thành công!'
            : 'Đã hủy áp dụng quy định tạm thời thành công!'
        );
        form.resetFields();
        onCancel();
      },
      onError: (err: any) => {
        message.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật quy định');
      }
    });
  };

  const ngayHetHanGoc = hoSo.ngay_het_han
    ? dayjs(hoSo.ngay_het_han).format('DD/MM/YYYY')
    : 'Không xác định';

  return (
    <Modal
      title={
        <Space>
          <SafetyCertificateOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
          <span>Quy định tạm thời duy trì hiệu lực số công bố</span>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={isPending}
      okText="Lưu thiết lập"
      cancelText="Đóng"
      width={580}
    >
      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 16 }}
        message={
          <div>
            <div>
              <strong>Hồ sơ:</strong> {hoSo.ten_san_pham} ({hoSo.ma_ho_so})
            </div>
            <div>
              <strong>Hạn sử dụng gốc:</strong> <Text type="danger" strong>{ngayHetHanGoc}</Text>{' '}
              <span className="text-gray-500">(Ngày này được giữ nguyên, không bị thay đổi)</span>
            </div>
          </div>
        }
      />

      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="ap_dung_quy_dinh_tam_thoi"
          label="Áp dụng quy định cho phép tiếp tục sử dụng số công bố"
          valuePropName="checked"
          extra="Bật chức năng này nếu hồ sơ được tiếp tục lưu hành theo Nghị quyết, Nghị định hoặc Thông tư gia hạn tự động"
        >
          <Switch checkedChildren="Đang áp dụng" unCheckedChildren="Tắt" />
        </Form.Item>

        {isApDungWatch && (
          <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100 mb-4">
            <Form.Item
              name="can_cu_quy_dinh"
              label="Căn cứ pháp lý / Văn bản quy định"
              rules={[{ required: true, message: 'Vui lòng nhập căn cứ quy định (VD: NĐ 07/2023, NQ 80/2023)' }]}
              extra="Ví dụ: Nghị quyết 80/2023/QH15, Nghị định 07/2023/NĐ-CP, Công văn số..."
            >
              <Input placeholder="Nhập số/tên văn bản quy định áp dụng" />
            </Form.Item>

            <Form.Item
              name="ngay_het_han_quy_dinh"
              label="Hạn hiệu lực được phép sử dụng theo quy định"
              rules={[{ required: true, message: 'Vui lòng chọn ngày hết hạn theo quy định' }]}
              extra="Hệ thống sẽ duy trì trạng thái hiệu lực và chỉ cảnh báo sắp hết hạn khi đến gần mốc ngày này"
            >
              <DatePicker className="w-full" format="DD/MM/YYYY" placeholder="Chọn ngày hết hạn theo quy định" />
            </Form.Item>

            <Form.Item
              name="tai_lieu_quy_dinh_url"
              label="Tài liệu / Công văn quy định đính kèm (Link hoặc tải file lên)"
              extra="Có thể dán link ngoài (Google Drive, văn bản...) hoặc bấm Upload để tải file trực tiếp từ máy tính"
            >
              <UploadOrLinkInput placeholder="Dán link hoặc tải file công văn/văn bản quy định lên..." />
            </Form.Item>

            <Form.Item
              name="ghi_chu"
              label="Ghi chú nội bộ"
            >
              <Input.TextArea rows={2} placeholder="Nhập ghi chú thêm nếu cần..." />
            </Form.Item>
          </div>
        )}
      </Form>
    </Modal>
  );
}
