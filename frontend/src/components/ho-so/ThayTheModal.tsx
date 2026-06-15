import { Modal, Form, Input, message, Alert } from 'antd';
import { useThayThe } from '@/hooks/queries/useHoSo';
import type { HoSoChung } from '@/types/ho-so.type';

interface Props {
  open: boolean;
  onCancel: () => void;
  hoSo: HoSoChung;
}

export default function ThayTheModal({ open, onCancel, hoSo }: Props) {
  const [form] = Form.useForm();
  const { mutate: thayThe, isPending } = useThayThe();

  const handleFinish = (values: any) => {
    const payload = {
      hoSoMoi: {
        ma_ho_so: values.ma_ho_so,
        ten_san_pham: values.ten_san_pham,
      }
    };
    
    thayThe({ id: hoSo.id, data: payload }, {
      onSuccess: () => {
        message.success('Thay thế thành công! Hồ sơ cũ đã bị hủy.');
        form.resetFields();
        onCancel();
      },
      onError: (err: any) => {
        message.error(err.response?.data?.message || 'Có lỗi xảy ra');
      }
    });
  };

  return (
    <Modal
      title={`Thay thế hồ sơ: ${hoSo.ten_san_pham}`}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={isPending}
      okText="Thực hiện Thay Thế"
      cancelText="Hủy"
    >
      <Alert 
        message="Lưu ý" 
        description="Thao tác này sẽ tạo một hồ sơ mới và cập nhật trạng thái hồ sơ hiện tại thành Bị thay thế." 
        type="warning" 
        showIcon 
        className="mb-4" 
      />
      <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ ten_san_pham: hoSo.ten_san_pham }}>
        <Form.Item name="ma_ho_so" label="Mã hồ sơ mới" rules={[{ required: true, message: 'Vui lòng nhập mã hồ sơ mới' }]}>
          <Input placeholder="Nhập mã hồ sơ mới" />
        </Form.Item>
        <Form.Item name="ten_san_pham" label="Tên sản phẩm mới" rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}>
          <Input placeholder="Nhập tên sản phẩm" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
