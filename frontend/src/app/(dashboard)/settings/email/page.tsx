'use client';

import React, { useState, useEffect } from 'react';
import { Card, Tabs, Form, Input, InputNumber, Switch, Button, Table, Space, Modal, Popconfirm, Alert, Spin, Checkbox, Row, Col, Typography, Divider } from 'antd';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import { 
  useSmtpConfig, 
  useUpdateSmtpConfig, 
  useTestSmtp, 
  useRecipients, 
  useAddRecipient, 
  useDeleteRecipient,
  useEvents,
  useSaveEvents
} from '@/hooks/queries/useEmailConfig';

const { TabPane } = Tabs;
const { Title, Text } = Typography;

const EVENT_OPTIONS = [
  { label: 'Hồ sơ được tạo', value: 'HO_SO_CREATED' },
  { label: 'Hồ sơ được cập nhật', value: 'HO_SO_UPDATED' },
  { label: 'Hồ sơ sắp hết hạn', value: 'HO_SO_SAP_HET_HAN' },
  { label: 'Hồ sơ đã hết hạn', value: 'HO_SO_DA_HET_HAN' },
  { label: 'Hồ sơ gia hạn', value: 'HO_SO_GIA_HAN' },
  { label: 'Hồ sơ bị thay thế', value: 'HO_SO_THAY_THE' },
];

export default function EmailConfigPage() {
  const { canConfigEmail } = usePermissions();
  const router = useRouter();
  
  // SMTP Config
  const { data: smtpConfig, isLoading: isSmtpLoading } = useSmtpConfig();
  const { mutate: updateSmtp, isPending: isUpdatingSmtp } = useUpdateSmtpConfig();
  const { mutate: testSmtp, isPending: isTestingSmtp } = useTestSmtp();
  
  // Events
  const { data: events, isLoading: isEventsLoading } = useEvents();
  const { mutate: saveEvents, isPending: isSavingEvents } = useSaveEvents();

  // Recipients
  const { data: recipients, isLoading: isRecipientsLoading } = useRecipients();
  const { mutate: addRecipient, isPending: isAddingRecipient } = useAddRecipient();
  const { mutate: deleteRecipient } = useDeleteRecipient();

  const [smtpForm] = Form.useForm();
  const [testForm] = Form.useForm();
  const [emailForm] = Form.useForm();
  
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [checkedEvents, setCheckedEvents] = useState<string[]>([]);

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

  useEffect(() => {
    if (events) {
      setCheckedEvents(events);
    }
  }, [events]);

  if (!canConfigEmail) return <Spin className="w-full mt-20" size="large" />;

  const handleSmtpSubmit = (values: any) => {
    updateSmtp(values);
  };

  const handleTestSubmit = (values: any) => {
    testSmtp(values.test_email, {
      onSuccess: () => setIsTestModalOpen(false),
    });
  };

  const handleSaveEvents = () => {
    saveEvents(checkedEvents);
  };

  const handleAddEmail = (values: any) => {
    addRecipient({ gia_tri: values.email }, {
      onSuccess: () => emailForm.resetFields()
    });
  };

  const recipientColumns = [
    { title: 'Địa chỉ Email nhận thông báo', dataIndex: 'gia_tri', key: 'gia_tri' },
    {
      title: 'Hành động',
      key: 'actions',
      width: 150,
      render: (_: any, record: any) => (
        <Popconfirm title="Bạn có chắc muốn xóa email này khỏi danh sách?" onConfirm={() => deleteRecipient(record.id)}>
          <Button type="link" danger>Xóa</Button>
        </Popconfirm>
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

        {/* TAB 2: RECIPIENTS CONFIG SIMPLIFIED */}
        <TabPane tab="Cấu hình Nhận Thông báo" key="2">
          <Row gutter={24}>
            <Col span={10}>
              <Card title="Các Sự kiện Kích hoạt Gửi Mail" loading={isEventsLoading}>
                <Text type="secondary" className="block mb-4">
                  Đánh dấu vào các sự kiện bạn muốn hệ thống tự động gửi email thông báo.
                </Text>
                <Checkbox.Group 
                  options={EVENT_OPTIONS} 
                  value={checkedEvents} 
                  onChange={(list) => setCheckedEvents(list as string[])}
                  className="flex flex-col gap-3 mb-6"
                />
                <Button type="primary" onClick={handleSaveEvents} loading={isSavingEvents}>
                  Lưu sự kiện
                </Button>
              </Card>
            </Col>
            
            <Col span={14}>
              <Card title="Danh sách Email Nhận Thông Báo">
                <Text type="secondary" className="block mb-4">
                  Các email trong danh sách này sẽ nhận được thông báo khi các sự kiện được đánh dấu ở bên trái xảy ra.
                </Text>

                <Form form={emailForm} onFinish={handleAddEmail} layout="inline" className="mb-4">
                  <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Vui lòng nhập email hợp lệ' }]}>
                    <Input placeholder="Nhập địa chỉ email..." style={{ width: '300px' }} />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={isAddingRecipient}>Thêm Email</Button>
                  </Form.Item>
                </Form>

                <Table 
                  dataSource={recipients} 
                  columns={recipientColumns} 
                  rowKey="id" 
                  loading={isRecipientsLoading}
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
          </Row>
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
    </div>
  );
}
