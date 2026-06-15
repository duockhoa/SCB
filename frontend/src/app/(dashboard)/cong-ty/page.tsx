'use client';

import { useState } from 'react';
import { Table, Button, Input, Space, Card, Modal, Form, message } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useCongTyList, useCreateCongTy, useUpdateCongTy, useDeleteCongTy } from '@/hooks/queries/useCongTy';
import dayjs from 'dayjs';

export default function CongTyPage() {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState('');

  const { data: result, isLoading } = useCongTyList();
  const allCongTy = Array.isArray(result) ? result : (result?.data || []);
  const dsCongTy = searchText
    ? allCongTy.filter((ct: any) =>
        ct.ten_cong_ty?.toLowerCase().includes(searchText.toLowerCase()) ||
        ct.ma_cong_ty?.toLowerCase().includes(searchText.toLowerCase()) ||
        ct.dia_chi?.toLowerCase().includes(searchText.toLowerCase()) ||
        ct.ma_so_thue?.toLowerCase().includes(searchText.toLowerCase())
      )
    : allCongTy;

  const { mutate: createCongTy, isPending: creating } = useCreateCongTy();
  const { mutate: updateCongTy, isPending: updating } = useUpdateCongTy();
  const { mutate: deleteCongTy } = useDeleteCongTy();

  const handleOpenModal = (record?: any) => {
    if (record) {
      setEditingId(record.id);
      form.setFieldsValue(record);
    } else {
      setEditingId(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (values: any) => {
    if (editingId) {
      updateCongTy({ id: editingId, data: values }, {
        onSuccess: () => {
          message.success('Cập nhật thành công');
          setIsModalOpen(false);
        }
      });
    } else {
      createCongTy(values, {
        onSuccess: () => {
          message.success('Thêm mới thành công');
          setIsModalOpen(false);
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Xóa công ty',
      content: 'Bạn có chắc chắn muốn xóa công ty này không? Hành động này không thể hoàn tác.',
      onOk: () => {
        deleteCongTy(id, {
          onSuccess: () => message.success('Xóa thành công')
        });
      }
    });
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Tên Công ty', dataIndex: 'ten_cong_ty', key: 'ten_cong_ty' },
    { title: 'Địa chỉ', dataIndex: 'dia_chi', key: 'dia_chi' },
    { title: 'Mã số thuế', dataIndex: 'ma_so_thue', key: 'ma_so_thue' },
    { title: 'Ngày tạo', dataIndex: 'created_at', key: 'created_at', render: (val: string) => dayjs(val).format('DD/MM/YYYY') },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined className="text-blue-500" />} onClick={() => handleOpenModal(record)} />
          <Button type="text" icon={<DeleteOutlined className="text-red-500" />} onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50">
      <Card 
        title={<span className="text-xl font-bold text-gray-800">Danh mục Công ty (Tổng: {dsCongTy.length})</span>} 
        variant="borderless"
        className="flex-1 min-h-0 shadow-sm rounded-xl overflow-hidden flex flex-col"
        styles={{ body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column' } }}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()} className="bg-emerald-600 hover:bg-emerald-500">
            Thêm mới
          </Button>
        }
      >
        <div className="p-4 border-b border-gray-100 flex justify-between bg-white shrink-0">
          <Input
            placeholder="Tìm kiếm công ty..."
            prefix={<SearchOutlined className="text-gray-400" />}
            className="max-w-md rounded-lg"
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-auto bg-white min-h-0">
          <Table
            columns={columns}
            dataSource={dsCongTy}
            rowKey="id"
            loading={isLoading}
            pagination={false}
            className="w-full"
          />
        </div>
      </Card>

      <Modal
        title={editingId ? "Cập nhật Công ty" : "Thêm mới Công ty"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={creating || updating}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="ten_cong_ty" label="Tên công ty" rules={[{ required: true, message: 'Vui lòng nhập tên công ty' }]}>
            <Input placeholder="Ví dụ: Công ty Cổ phần Dược Khoa" />
          </Form.Item>
          <Form.Item name="dia_chi" label="Địa chỉ">
            <Input.TextArea rows={2} placeholder="Nhập địa chỉ trụ sở..." />
          </Form.Item>
          <Form.Item name="ma_so_thue" label="Mã số thuế">
            <Input placeholder="Nhập mã số thuế" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
