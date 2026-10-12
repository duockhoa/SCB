'use client';

import React, { useState, useEffect } from 'react';
import { Card, Tabs, Form, Input, InputNumber, Switch, Button, Table, Modal, Popconfirm, Alert, Spin, Checkbox, Row, Col, Typography } from 'antd';
import { MailOutlined, SendOutlined, SaveOutlined, PlusOutlined } from '@ant-design/icons';
import { usePermissions } from '@/hooks/usePermissions';
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

const { Title, Text } = Typography;

const EVENT_OPTIONS = [
  { label: 'Hồ sơ được tạo mới', value: 'HO_SO_CREATED' },
  { label: 'Hồ sơ được cập nhật', value: 'HO_SO_UPDATED' },
  { label: 'Hồ sơ sắp hết hạn', value: 'HO_SO_SAP_HET_HAN' },
  { label: 'Hồ sơ đã hết hạn', value: 'HO_SO_DA_HET_HAN' },
  { label: 'Hồ sơ được gia hạn', value: 'HO_SO_GIA_HAN' },
  { label: 'Hồ sơ bị thay thế', value: 'HO_SO_THAY_THE' },
  { label: 'Hồ sơ có lịch sử thay đổi', value: 'HO_SO_THAY_DOI' },
];

export default function EmailSettingsTab() {
  const { canConfigEmail } = usePermissions();
  
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
    if (smtpConfig) {
      smtpForm.setFieldsValue({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        user: smtpConfig.user,
        from_email: smtpConfig.from_email,
        is_active: smtpConfig.is_active,
        pass: '',
      });
    }
  }, [smtpConfig, smtpForm]);

  useEffect(() => {
    if (events) {
      setCheckedEvents(events);
    }
  }, [events]);

  if (!canConfigEmail) {
    return (
      <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500">
        Bạn không có quyền cấu hình email hệ thống.
      </div>
    );
  }

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
      width: 120,
      render: (_: any, record: any) => (
        <Popconfirm title="Bạn có chắc muốn xóa email này khỏi danh sách?" onConfirm={() => deleteRecipient(record.id)}>
          <Button type="link" danger size="small">Xóa</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Card className="rounded-xl border border-gray-200 shadow-sm" styles={{ body: { padding: '24px' } }}>
      <div className="mb-6">
        <Title level={4} className="!m-0 text-gray-800 flex items-center gap-2">
          <MailOutlined className="text-blue-500" />
          Cấu hình Email Thông báo Hệ thống
        </Title>
        <Text type="secondary" className="text-sm">
          Thiết lập thông số máy chủ gửi thư (SMTP) và danh sách địa chỉ nhận thông báo khi hồ sơ thay đổi hoặc sắp hết hạn.
        </Text>
      </div>
      
      <Tabs defaultActiveKey="1">
        {/* TAB 1: SMTP CONFIG */}
        <Tabs.TabPane tab="Cấu hình Mail Gửi (SMTP)" key="1">
          <Card loading={isSmtpLoading} className="max-w-2xl border-gray-100 bg-gray-50/50">
            <Form
              form={smtpForm}
              layout="vertical"
              onFinish={handleSmtpSubmit}
              initialValues={{ secure: false, is_active: true }}
            >
              <div className="grid grid-cols-2 gap-4">
                <Form.Item name="host" label="Máy chủ SMTP (Host)" rules={[{ required: true, message: 'Vui lòng nhập Host' }]}>
                  <Input placeholder="VD: smtp.gmail.com" />
                </Form.Item>
                <Form.Item name="port" label="Cổng (Port)" rules={[{ required: true, message: 'Vui lòng nhập Port' }]}>
                  <InputNumber className="w-full" placeholder="VD: 587" />
                </Form.Item>
              </div>

              <Form.Item name="secure" label="Bảo mật SSL/TLS" valuePropName="checked">
                <Switch />
              </Form.Item>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item name="user" label="Tài khoản đăng nhập" rules={[{ required: true, message: 'Vui lòng nhập tài khoản' }]}>
                  <Input placeholder="VD: email@example.com" />
                </Form.Item>
                <Form.Item name="from_email" label="Email hiển thị người gửi" rules={[{ required: true, message: 'Vui lòng nhập email gửi' }]}>
                  <Input placeholder="VD: noreply@example.com" />
                </Form.Item>
              </div>

              <Form.Item name="pass" label="Mật khẩu ứng dụng">
                <Input.Password placeholder="Để trống nếu không muốn đổi mật khẩu" />
              </Form.Item>

              {smtpConfig?.pass_configured && (
                <Alert message="Mật khẩu SMTP đã được cấu hình và lưu an toàn." type="success" showIcon className="mb-4" />
              )}

              <Form.Item name="is_active" label="Trạng thái sử dụng" valuePropName="checked">
                <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
              </Form.Item>

              <div className="flex gap-3 pt-2">
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isUpdatingSmtp}>
                  Lưu cấu hình SMTP
                </Button>
                <Button icon={<SendOutlined />} onClick={() => setIsTestModalOpen(true)}>
                  Gửi mail thử nghiệm
                </Button>
              </div>
            </Form>
          </Card>
        </Tabs.TabPane>

        {/* TAB 2: RECIPIENTS CONFIG */}
        <Tabs.TabPane tab="Cấu hình Nhận Thông báo & Sự kiện" key="2">
          <Row gutter={[24, 24]}>
            <Col xs={24} md={10}>
              <Card title="Sự kiện Kích hoạt Gửi Mail" loading={isEventsLoading} className="border-gray-200">
                <Text type="secondary" className="block mb-4 text-xs">
                  Chọn các sự kiện hệ thống tự động gửi email thông báo tới danh sách người nhận.
                </Text>
                <Checkbox.Group 
                  options={EVENT_OPTIONS} 
                  value={checkedEvents} 
                  onChange={(list) => setCheckedEvents(list as string[])}
                  className="flex flex-col gap-3 mb-6"
                />
                <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveEvents} loading={isSavingEvents}>
                  Lưu cài đặt sự kiện
                </Button>
              </Card>
            </Col>
            
            <Col xs={24} md={14}>
              <Card title="Danh sách Email Nhận Thông Báo" className="border-gray-200">
                <Text type="secondary" className="block mb-4 text-xs">
                  Các email này sẽ nhận được thông báo khi các sự kiện đánh dấu bên cạnh diễn ra.
                </Text>

                <Form form={emailForm} onFinish={handleAddEmail} layout="inline" className="mb-4">
                  <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}>
                    <Input placeholder="Nhập địa chỉ email nhận..." style={{ width: '280px' }} />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={isAddingRecipient}>
                      Thêm
                    </Button>
                  </Form.Item>
                </Form>

                <Table 
                  dataSource={recipients} 
                  columns={recipientColumns} 
                  rowKey="id" 
                  loading={isRecipientsLoading}
                  pagination={{ pageSize: 5 }}
                  size="small"
                />
              </Card>
            </Col>
          </Row>
        </Tabs.TabPane>
      </Tabs>

      {/* MODAL TEST EMAIL */}
      <Modal
        title="Gửi email test nghiệm thu"
        open={isTestModalOpen}
        onCancel={() => setIsTestModalOpen(false)}
        footer={null}
      >
        <Form form={testForm} layout="vertical" onFinish={handleTestSubmit}>
          <Form.Item name="test_email" label="Email nhận thư test" rules={[{ required: true, type: 'email', message: 'Vui lòng nhập email hợp lệ' }]}>
            <Input placeholder="Nhập địa chỉ email của bạn..." />
          </Form.Item>
          <div className="text-right">
            <Button onClick={() => setIsTestModalOpen(false)} className="mr-2">Hủy</Button>
            <Button type="primary" htmlType="submit" loading={isTestingSmtp}>Gửi thử</Button>
          </div>
        </Form>
      </Modal>
    </Card>
  );
}
