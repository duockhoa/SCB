'use client';

import React, { useState, useEffect } from 'react';
import { Card, Tabs, Form, Input, InputNumber, Switch, Button, Table, Space, Modal, Select, Popconfirm, Alert, Spin } from 'antd';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import { 
  useSmtpConfig, 
  useUpdateSmtpConfig, 
  useTestSmtp, 
  useRecipients, 
  useAddRecipient, 
  useUpdateRecipient, 
  useDeleteRecipient 
} from '@/hooks/queries/useEmailConfig';

const { TabPane } = Tabs;

export default function EmailConfigPage() {
  const { canConfigEmail } = usePermissions();
  const router = useRouter();
  
  // SMTP Config
  const { data: smtpConfig, isLoading: isSmtpLoading } = useSmtpConfig();
  const { mutate: updateSmtp, isPending: isUpdatingSmtp } = useUpdateSmtpConfig();
  const { mutate: testSmtp, isPending: isTestingSmtp } = useTestSmtp();
  
  // Recipients
  const { data: recipients, isLoading: isRecipientsLoading } = useRecipients();
  const { mutate: addRecipient } = useAddRecipient();
  const { mutate: updateRecipient } = useUpdateRecipient();
  const { mutate: deleteRecipient } = useDeleteRecipient();

  const [smtpForm] = Form.useForm();
  const [testForm] = Form.useForm();
  const [recipientForm] = Form.useForm();
  
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isRecipientModalOpen, setIsRecipientModalOpen] = useState(false);
  const [editingRecipientId, setEditingRecipientId] = useState<number | null>(null);

  useEffect(() => {
    if (!canConfigEmail) {
      router.push('/');
    }
  }, [canConfigEmail, router]);

  useEffect(() => {
    if (smtpConfig) {
      smtpForm.setFieldsValue({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        user: smtpConfig.user,
        from_email: smtpConfig.from_email,
        is_active: smtpConfig.is_active,
        pass: '', // Leave empty as requested
      });
    }
  }, [smtpConfig, smtpForm]);

  if (!canConfigEmail) return <Spin className="w-full mt-20" size="large" />;

  const handleSmtpSubmit = (values: any) => {
    updateSmtp(values);
  };

  const handleTestSubmit = (values: any) => {
    testSmtp(values.test_email, {
      onSuccess: () => setIsTestModalOpen(false),
    });
  };

  const openRecipientModal = (record?: any) => {
    if (record) {
      setEditingRecipientId(record.id);
      recipientForm.setFieldsValue(record);
    } else {
      setEditingRecipientId(null);
      recipientForm.resetFields();
      recipientForm.setFieldsValue({ trang_thai: true });
    }
    setIsRecipientModalOpen(true);
  };

  const handleRecipientSubmit = (values: any) => {
    if (editingRecipientId) {
      updateRecipient({ id: editingRecipientId, payload: values }, {
        onSuccess: () => setIsRecipientModalOpen(false)
      });
    } else {
      addRecipient(values, {
        onSuccess: () => setIsRecipientModalOpen(false)
      });
    }
  };

  const recipientColumns = [
    { title: 'Sự kiện', dataIndex: 'ma_su_kien', key: 'ma_su_kien' },
    { title: 'Loại nhận', dataIndex: 'loai_dieu_kien', key: 'loai_dieu_kien' },
    { title: 'Giá trị (Email/Phòng/Quyền)', dataIndex: 'gia_tri', key: 'gia_tri' },
    { 
      title: 'Trạng thái', 
      dataIndex: 'trang_thai', 
      key: 'trang_thai',
      render: (val: boolean) => val ? <span className="text-green-600 font-medium">Hoạt động</span> : <span className="text-red-500">Tạm dừng</span> 
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button type="link" onClick={() => openRecipientModal(record)}>Sửa</Button>
          <Popconfirm title="Bạn có chắc muốn xóa?" onConfirm={() => deleteRecipient(record.id)}>
            <Button type="link" danger>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Cấu hình Email Hệ thống</h1>
      
      <Tabs defaultActiveKey="1" type="card">
        {/* TAB 1: SMTP CONFIG */}
        <TabPane tab="Cấu hình Mail Gửi (SMTP)" key="1">
          <Card loading={isSmtpLoading} className="max-w-2xl">
            <Form
              form={smtpForm}
              layout="vertical"
              onFinish={handleSmtpSubmit}
              initialValues={{ secure: false, is_active: true }}
            >
              <div className="grid grid-cols-2 gap-4">
                <Form.Item name="host" label="Máy chủ SMTP (Host)" rules={[{ required: true }]}>
                  <Input placeholder="VD: smtp.gmail.com" />
                </Form.Item>
                <Form.Item name="port" label="Cổng (Port)" rules={[{ required: true }]}>
                  <InputNumber className="w-full" placeholder="VD: 587" />
                </Form.Item>
              </div>

              <Form.Item name="secure" label="Bảo mật SSL/TLS" valuePropName="checked">
                <Switch />
              </Form.Item>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item name="user" label="Tài khoản đăng nhập" rules={[{ required: true }]}>
                  <Input placeholder="VD: email@example.com" />
                </Form.Item>
                <Form.Item name="from_email" label="Email hiển thị người gửi" rules={[{ required: true }]}>
                  <Input placeholder="VD: noreply@example.com" />
                </Form.Item>
              </div>

              <Form.Item name="pass" label="Mật khẩu ứng dụng">
                <Input.Password placeholder="Để trống nếu không muốn đổi mật khẩu" />
              </Form.Item>

              {smtpConfig?.pass_configured && (
                <Alert message="Mật khẩu đã được cấu hình và mã hóa bảo mật." type="success" showIcon className="mb-4" />
              )}

              <Form.Item name="is_active" label="Trạng thái sử dụng" valuePropName="checked">
                <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
              </Form.Item>

              <div className="flex gap-4">
                <Button type="primary" htmlType="submit" loading={isUpdatingSmtp}>
                  Lưu cấu hình SMTP
                </Button>
                <Button onClick={() => setIsTestModalOpen(true)}>
                  Gửi mail test
                </Button>
              </div>
            </Form>
          </Card>
        </TabPane>

        {/* TAB 2: RECIPIENTS CONFIG */}
        <TabPane tab="Cấu hình Người Nhận (Events)" key="2">
          <Card>
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-medium">Danh sách cấu hình người nhận</h2>
              <Button type="primary" onClick={() => openRecipientModal()}>Thêm người nhận</Button>
            </div>
            
            <Table 
              dataSource={recipients} 
              columns={recipientColumns} 
              rowKey="id" 
              loading={isRecipientsLoading}
              pagination={false}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* MODAL TEST EMAIL */}
      <Modal
        title="Gửi email test nghiệm thu"
        open={isTestModalOpen}
        onCancel={() => setIsTestModalOpen(false)}
        footer={null}
      >
        <Form form={testForm} layout="vertical" onFinish={handleTestSubmit}>
          <Form.Item name="test_email" label="Email nhận thư test" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="Nhập địa chỉ email của bạn" />
          </Form.Item>
          <div className="text-right">
            <Button onClick={() => setIsTestModalOpen(false)} className="mr-2">Hủy</Button>
            <Button type="primary" htmlType="submit" loading={isTestingSmtp}>Gửi</Button>
          </div>
        </Form>
      </Modal>

      {/* MODAL RECIPIENT */}
      <Modal
        title={editingRecipientId ? "Sửa người nhận" : "Thêm người nhận"}
        open={isRecipientModalOpen}
        onCancel={() => setIsRecipientModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={recipientForm} layout="vertical" onFinish={handleRecipientSubmit}>
          <Form.Item name="ma_su_kien" label="Sự kiện" rules={[{ required: true }]}>
            <Select placeholder="Chọn sự kiện">
              <Select.Option value="HO_SO_CREATED">Hồ sơ được tạo</Select.Option>
              <Select.Option value="HO_SO_UPDATED">Hồ sơ được cập nhật</Select.Option>
              <Select.Option value="HO_SO_SAP_HET_HAN">Hồ sơ sắp hết hạn</Select.Option>
              <Select.Option value="HO_SO_DA_HET_HAN">Hồ sơ đã hết hạn</Select.Option>
              <Select.Option value="HO_SO_GIA_HAN">Hồ sơ gia hạn</Select.Option>
              <Select.Option value="HO_SO_THAY_THE">Hồ sơ bị thay thế</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="loai_dieu_kien" label="Loại điều kiện nhận" rules={[{ required: true }]}>
            <Select placeholder="Chọn loại điều kiện">
              <Select.Option value="EMAIL_CU_THE">Email cụ thể</Select.Option>
              <Select.Option value="ROLE">Theo vai trò</Select.Option>
              <Select.Option value="PHONG_BAN">Theo phòng ban</Select.Option>
              <Select.Option value="NGUOI_PHU_TRACH">Người tạo / Phụ trách</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item 
            noStyle 
            shouldUpdate={(prevValues, currentValues) => prevValues.loai_dieu_kien !== currentValues.loai_dieu_kien}
          >
            {({ getFieldValue }) => {
              const loai = getFieldValue('loai_dieu_kien');
              if (loai === 'NGUOI_PHU_TRACH') return null;
              
              return (
                <Form.Item name="gia_tri" label="Giá trị (Email / Mã vai trò / Tên phòng ban)" rules={[{ required: true }]}>
                  <Input placeholder={loai === 'EMAIL_CU_THE' ? 'VD: a@gmail.com' : 'Nhập giá trị...'} />
                </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item name="trang_thai" label="Trạng thái" valuePropName="checked">
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>

          <div className="text-right">
            <Button onClick={() => setIsRecipientModalOpen(false)} className="mr-2">Hủy</Button>
            <Button type="primary" htmlType="submit">Lưu</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
