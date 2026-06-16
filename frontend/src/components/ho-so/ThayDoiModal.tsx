import React from 'react';
import { Modal, Form, message } from 'antd';
import { useThayDoi } from '@/hooks/queries/useHoSo';
import type { HoSoChung } from '@/types/ho-so.type';
import LichSuThayDoiFields from './LichSuThayDoiFields';

interface Props {
  open: boolean;
  onCancel: () => void;
  hoSo: HoSoChung;
}

export default function ThayDoiModal({ open, onCancel, hoSo }: Props) {
  const [form] = Form.useForm();
  const { mutate: thayDoi, isPending } = useThayDoi();

  const handleFinish = (values: any) => {
    const payload = {
      ...values,
      ngay_thay_doi: values.ngay_thay_doi ? values.ngay_thay_doi.format('YYYY-MM-DD') : undefined,
      ngay_phe_duyet: values.ngay_phe_duyet ? values.ngay_phe_duyet.format('YYYY-MM-DD') : undefined,
    };
    
    thayDoi({ id: hoSo.id, data: payload }, {
      onSuccess: () => {
        message.success('Thêm lịch sử thay đổi thành công!');
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
      title={`Thêm lịch sử thay đổi: ${hoSo.ten_san_pham}`}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={isPending}
      okText="Lưu thay đổi"
      cancelText="Hủy"
      width={700}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <LichSuThayDoiFields title="Thông tin chi tiết thay đổi" />
      </Form>
    </Modal>
  );
}
