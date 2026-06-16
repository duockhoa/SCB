import { Modal, Form, Input, DatePicker, message, Alert } from 'antd';
import { useThayThe } from '@/hooks/queries/useHoSo';
import type { HoSoChung } from '@/types/ho-so.type';
import LichSuThayDoiFields from './LichSuThayDoiFields';

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
      ...values,
      ma_ho_so_moi: values.ma_ho_so_moi,
      so_chinh_moi: values.so_chinh_moi,
      ngay_cong_bo: values.ngay_cong_bo.format('YYYY-MM-DD'),
      ngay_het_han: values.ngay_het_han ? values.ngay_het_han.format('YYYY-MM-DD') : undefined,
      ngay_thay_doi: values.ngay_thay_doi ? values.ngay_thay_doi.format('YYYY-MM-DD') : undefined,
      ngay_phe_duyet: values.ngay_phe_duyet ? values.ngay_phe_duyet.format('YYYY-MM-DD') : undefined,
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
      width={700}
    >
      <Alert 
        message="Lưu ý" 
        description="Thao tác này sẽ tạo một hồ sơ mới và cập nhật trạng thái hồ sơ hiện tại thành Bị thay thế." 
        type="warning" 
        showIcon 
        className="mb-4" 
      />
      <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ ten_san_pham: hoSo.ten_san_pham }}>
        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item name="ma_ho_so_moi" label="Mã hồ sơ mới" rules={[{ required: true, message: 'Vui lòng nhập mã hồ sơ mới' }]}>
            <Input placeholder="Nhập mã hồ sơ mới" />
          </Form.Item>
          <Form.Item name="so_chinh_moi" label="Số công bố/đăng ký mới" rules={[{ required: true, message: 'Vui lòng nhập số công bố' }]}>
            <Input placeholder="Nhập số công bố mới" />
          </Form.Item>
        </div>
        
        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item name="ngay_cong_bo" label="Ngày công bố mới" rules={[{ required: true, message: 'Vui lòng chọn ngày công bố' }]}>
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="ngay_het_han" label="Ngày hết hạn mới">
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>
        </div>
        <LichSuThayDoiFields />
      </Form>
    </Modal>
  );
}
