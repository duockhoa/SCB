import { Modal, Form, Input, DatePicker, message } from 'antd';
import { useCapSo } from '@/hooks/queries/useHoSo';
import type { HoSoChung } from '@/types/ho-so.type';
import LichSuThayDoiFields from './LichSuThayDoiFields';

interface Props {
  open: boolean;
  onCancel: () => void;
  hoSo: HoSoChung;
}

export default function CapSoModal({ open, onCancel, hoSo }: Props) {
  const [form] = Form.useForm();
  const { mutate: capSo, isPending } = useCapSo();

  const handleFinish = (values: any) => {
    const payload = {
      ...values,
      so_chinh: values.so_chinh,
      ngay_cong_bo: values.ngay_cong_bo.format('YYYY-MM-DD'),
      ngay_het_han: values.ngay_het_han ? values.ngay_het_han.format('YYYY-MM-DD') : undefined,
      ngay_thay_doi: values.ngay_thay_doi ? values.ngay_thay_doi.format('YYYY-MM-DD') : undefined,
      ngay_phe_duyet: values.ngay_phe_duyet ? values.ngay_phe_duyet.format('YYYY-MM-DD') : undefined,
    };
    
    capSo({ id: hoSo.id, data: payload }, {
      onSuccess: () => {
        message.success('Cấp số thành công!');
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
      title={`Cấp số công bố: ${hoSo.ten_san_pham}`}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={isPending}
      okText="Xác nhận"
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="so_chinh" label="Số công bố" rules={[{ required: true, message: 'Vui lòng nhập số công bố' }]}>
          <Input placeholder="Nhập số công bố" />
        </Form.Item>
        <Form.Item name="ngay_cong_bo" label="Ngày công bố" rules={[{ required: true, message: 'Vui lòng chọn ngày công bố' }]}>
          <DatePicker className="w-full" format="DD/MM/YYYY" />
        </Form.Item>
        <Form.Item name="ngay_het_han" label="Ngày hết hạn" rules={[{ required: true, message: 'Vui lòng chọn ngày hết hạn' }]}>
          <DatePicker className="w-full" format="DD/MM/YYYY" />
        </Form.Item>
        <LichSuThayDoiFields />
      </Form>
    </Modal>
  );
}
