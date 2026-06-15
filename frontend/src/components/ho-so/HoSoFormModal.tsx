import { Modal, Form, Input, Select, message, Divider } from 'antd';
import { useEffect } from 'react';
import { useCreateHoSo, useUpdateHoSo } from '@/hooks/queries/useHoSo';
import { useCongTyList } from '@/hooks/queries/useCongTy';
import { useLoaiHoSoList } from '@/hooks/queries/useDanhMuc';
import type { HoSoChung } from '@/types/ho-so.type';
import { LOAI_HO_SO_CODE } from '@/constants/loai-ho-so';

import FormThuoc from './forms/FormThuoc';
import FormMyPham from './forms/FormMyPham';
import FormTbyt from './forms/FormTbyt';
import FormTpbvskCongBo from './forms/FormTpbvskCongBo';
import FormTpbvskTuCongBo from './forms/FormTpbvskTuCongBo';
import FormCfsCpp from './forms/FormCfsCpp';

interface Props {
  mode: 'create' | 'edit';
  open: boolean;
  onCancel: () => void;
  initialData?: HoSoChung;
}

export default function HoSoFormModal({ mode, open, onCancel, initialData }: Props) {
  const [form] = Form.useForm();
  const { mutate: createHoSo, isPending: creating } = useCreateHoSo();
  const { mutate: updateHoSo, isPending: updating } = useUpdateHoSo();

  const { data: congTyResult, isLoading: loadingCongTy } = useCongTyList({ limit: 1000 });
  const dsCongTy = congTyResult?.data || [];

  const { data: loaiHoSoResult, isLoading: loadingLoaiHoSo } = useLoaiHoSoList();
  const loaiHoSoList = loaiHoSoResult?.data || [];

  const currentLoaiHoSo = Form.useWatch('loai_ho_so_id', form);
  const currentMaLoai = loaiHoSoList.find((l: any) => l.id === currentLoaiHoSo)?.ma_loai;

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialData) {
        // Trích xuất thong_tin_rieng một cách tự động (dynamic)
        let thong_tin_rieng = undefined;
        const dacThuKey = Object.keys(initialData).find(key => 
          key.startsWith('ho_so_') && 
          (initialData as any)[key] && 
          typeof (initialData as any)[key] === 'object' && 
          key !== 'ho_so_chung' && 
          key !== 'ho_so_cu'
        );
        if (dacThuKey) {
          thong_tin_rieng = (initialData as any)[dacThuKey];
        }

        form.setFieldsValue({
          ma_ho_so: initialData.ma_ho_so,
          ten_san_pham: initialData.ten_san_pham,
          loai_ho_so_id: initialData.loai_ho_so_id, 
          cong_ty_so_huu_id: initialData.cong_ty_so_huu_id,
          ghi_chu: initialData.ghi_chu || '',
          ho_so_luu_url: initialData.ho_so_luu_url || '',
          thong_tin_rieng, // Đổ dữ liệu riêng vào form
        });
      } else if (mode === 'create') {
        form.resetFields();
      }
    }
  }, [open, mode, initialData, form]);

  const handleValuesChange = (changedValues: any) => {
    if (changedValues.loai_ho_so_id) {
      if (mode === 'edit' && initialData?.loai_ho_so_id && changedValues.loai_ho_so_id !== initialData.loai_ho_so_id) {
        Modal.confirm({
          title: 'Cảnh báo thay đổi Loại hồ sơ',
          content: 'Việc đổi loại hồ sơ sẽ xóa toàn bộ dữ liệu đặc thù đã nhập trước đó. Bạn có chắc chắn muốn đổi?',
          onOk: () => {
            form.setFieldValue('thong_tin_rieng', undefined);
          },
          onCancel: () => {
            // Hoàn tác về loại hồ sơ cũ
            form.setFieldValue('loai_ho_so_id', initialData.loai_ho_so_id);
          }
        });
      } else {
        // Reset thông tin riêng khi tạo mới hoặc chuyển sang loại khác không bị trùng initial
        form.setFieldValue('thong_tin_rieng', undefined);
      }
    }
  };

  const handleFinish = (values: any) => {
    const payload = {
      ...values,
    };

    if (mode === 'create') {
      createHoSo(payload, {
        onSuccess: () => {
          message.success('Tạo mới hồ sơ thành công!');
          form.resetFields();
          onCancel();
        },
        onError: (err: any) => {
          message.error(err.response?.data?.message || 'Lỗi khi tạo mới');
        }
      });
    } else {
      if (!initialData?.id) return;
      updateHoSo({ id: initialData.id, data: payload }, {
        onSuccess: () => {
          message.success('Cập nhật hồ sơ thành công!');
          onCancel();
        },
        onError: (err: any) => {
          message.error(err.response?.data?.message || 'Lỗi khi cập nhật');
        }
      });
    }
  };

  const renderDynamicFields = () => {
    if (!currentMaLoai) return null;
    switch (currentMaLoai) {
      case LOAI_HO_SO_CODE.THUOC: return <FormThuoc />;
      case LOAI_HO_SO_CODE.MY_PHAM: return <FormMyPham />;
      case LOAI_HO_SO_CODE.TBYT: return <FormTbyt />;
      case LOAI_HO_SO_CODE.TPBVSK_CONG_BO: return <FormTpbvskCongBo />;
      case LOAI_HO_SO_CODE.TPBVSK_TU_CONG_BO: return <FormTpbvskTuCongBo />;
      case LOAI_HO_SO_CODE.CFS_CPP: return <FormCfsCpp />;
      default: return null;
    }
  };

  return (
    <Modal
      title={mode === 'create' ? 'Tạo mới Hồ Sơ' : 'Cập nhật Hồ Sơ'}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={creating || updating}
      okText="Lưu"
      cancelText="Hủy"
      width={700}
    >
      <Form 
        form={form} 
        layout="vertical" 
        onFinish={handleFinish} 
        onValuesChange={handleValuesChange}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Form.Item name="ma_ho_so" label="Mã hồ sơ" rules={[{ required: true, message: 'Vui lòng nhập mã hồ sơ' }]}>
            <Input placeholder="Nhập mã hồ sơ" />
          </Form.Item>
          
          <Form.Item name="ten_san_pham" label="Tên sản phẩm" rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}>
            <Input placeholder="Nhập tên sản phẩm" />
          </Form.Item>
          
          <Form.Item name="loai_ho_so_id" label="Loại hồ sơ" rules={[{ required: true, message: 'Vui lòng chọn loại hồ sơ' }]}>
            <Select placeholder="Chọn loại hồ sơ" loading={loadingLoaiHoSo}>
              {loaiHoSoList.map((loai: any) => (
                <Select.Option key={loai.id} value={loai.id}>{loai.ten_loai}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name="cong_ty_so_huu_id" label="Công ty / Đơn vị sở hữu">
            <Select 
              showSearch
              allowClear
              placeholder="Nhập tên công ty để tìm kiếm..."
              loading={loadingCongTy}
              optionFilterProp="children"
              filterOption={(input, option) => (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())}
              options={dsCongTy.map((ct: any) => ({ value: ct.id, label: ct.ten_cong_ty }))}
            />
          </Form.Item>
        </div>

        <Form.Item name="ghi_chu" label="Ghi chú">
          <Input.TextArea rows={2} placeholder="Ghi chú thêm..." />
        </Form.Item>

        <Form.Item 
          name="ho_so_luu_url" 
          label="Link Hồ sơ lưu trữ (Drive)"
          rules={[
            { type: 'url', message: 'Vui lòng nhập định dạng URL hợp lệ' }
          ]}
        >
          <Input placeholder="Dán link Google Drive hoặc URL thư mục lưu trữ" />
        </Form.Item>

        {currentLoaiHoSo && (
          <>
            <Divider orientation="left" plain>Thông tin đặc thù</Divider>
            {renderDynamicFields()}
          </>
        )}
      </Form>
    </Modal>
  );
}
