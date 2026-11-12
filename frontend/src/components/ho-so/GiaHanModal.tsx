import { Modal, Form, DatePicker, message } from 'antd';
import { useGiaHan } from '@/hooks/queries/useHoSo';
import type { HoSoChung } from '@/types/ho-so.type';
import LichSuThayDoiFields from './LichSuThayDoiFields';

interface Props {
  open: boolean;
  onCancel: () => void;
  hoSo: HoSoChung;
}

export default function GiaHanModal({ open, onCancel, hoSo }: Props) {
  const [form] = Form.useForm();
  const { mutate: giaHan, isPending } = useGiaHan();

  const handleFinish = (values: any) => {
    const payload = {
      ...values,
      ngay_het_han: values.ngay_het_han_moi.format('YYYY-MM-DD'),
      ngay_thay_doi: values.ngay_thay_doi ? values.ngay_thay_doi.format('YYYY-MM-DD') : undefined,
      ngay_phe_duyet: values.ngay_phe_duyet ? values.ngay_phe_duyet.format('YYYY-MM-DD') : undefined,
    };
    
    giaHan({ id: hoSo.id, data: payload }, {
      onSuccess: () => {
        message.success('Gia hạn thành công!');
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
      title={`Gia hạn hồ sơ: ${hoSo.ten_san_pham}`}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={isPending}
      okText="Xác nhận Gia Hạn"
      cancelText="Hủy"
      style={{ maxWidth: 'calc(100vw - 24px)' }}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="ngay_het_han_moi" label="Ngày hết hạn mới" rules={[{ required: true, message: 'Vui lòng chọn ngày hết hạn mới' }]}>
          <DatePicker className="w-full" format="DD/MM/YYYY" />
        </Form.Item>
        <LichSuThayDoiFields />
      </Form>
    </Modal>
  );
}
