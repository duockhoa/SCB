'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, Col, Row, Typography, Statistic, Table, Button, Tag, 
  Modal, Form, InputNumber, Select, Switch, message, Tooltip, Alert, Space, Divider 
} from 'antd';
import { 
  DatabaseOutlined, TagsOutlined, ClockCircleOutlined, 
  EditOutlined, ReloadOutlined, InfoCircleOutlined, CheckCircleOutlined,
  CalendarOutlined, SyncOutlined
} from '@ant-design/icons';
import { axiosInstance } from '@/services/api';

const { Title, Text } = Typography;

interface LoaiHoSoItem {
  id: number;
  ma_loai: string;
  ten_loai: string;
  mo_ta?: string;
  thu_tu: number;
  trang_thai: boolean;
  thoi_gian_canh_bao: number;
  don_vi_canh_bao: 'THANG' | 'NGAY' | string;
}

export default function DanhMucSettingsTab() {
  const [loaiHoSoList, setLoaiHoSoList] = useState<LoaiHoSoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedLoai, setSelectedLoai] = useState<LoaiHoSoItem | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [form] = Form.useForm();
  const formThoiGian = Form.useWatch('thoi_gian_canh_bao', form) || 6;
  const formDonVi = Form.useWatch('don_vi_canh_bao', form) || 'THANG';

  const fetchLoaiHoSo = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/danh-muc/loai-ho-so');
      setLoaiHoSoList(res.data || []);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Lỗi khi tải danh sách loại hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoaiHoSo();
  }, []);

  const handleOpenEdit = (record: LoaiHoSoItem) => {
    setSelectedLoai(record);
    form.setFieldsValue({
      thoi_gian_canh_bao: record.thoi_gian_canh_bao ?? 6,
      don_vi_canh_bao: record.don_vi_canh_bao || 'THANG',
      dong_bo_tat_ca: true,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (values: any) => {
    if (!selectedLoai) return;
    setSubmitting(true);
    try {
      const res = await axiosInstance.patch(`/danh-muc/loai-ho-so/${selectedLoai.id}/canh-bao-han`, {
        thoi_gian_canh_bao: values.thoi_gian_canh_bao,
        don_vi_canh_bao: values.don_vi_canh_bao,
        dong_bo_tat_ca: values.dong_bo_tat_ca,
      });

      const syncCount = res.data?.syncCount || 0;
      message.success(
        `Cập nhật cấu hình thành công! ${values.dong_bo_tat_ca ? `Đã đồng bộ cập nhật ${syncCount} hồ sơ hiện có.` : ''}`
      );
      setIsModalOpen(false);
      fetchLoaiHoSo();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Lỗi khi lưu cấu hình');
    } finally {
      setSubmitting(false);
    }
  };

  // Tính ngày xem trước mẫu dựa trên form state
  const getPreviewDate = () => {
    const sampleExpiry = new Date();
    sampleExpiry.setFullYear(sampleExpiry.getFullYear() + 1); // 1 năm tới
    const sampleStr = sampleExpiry.toISOString().slice(0, 10);

    const reminder = new Date(sampleExpiry);
    if (formDonVi === 'NGAY') {
      reminder.setDate(reminder.getDate() - (Number(formThoiGian) || 0));
    } else {
      reminder.setMonth(reminder.getMonth() - (Number(formThoiGian) || 0));
    }

    return {
      expiryStr: sampleStr,
      reminderStr: reminder.toISOString().slice(0, 10),
    };
  };

  const preview = getPreviewDate();

  const columns = [
    {
      title: 'Mã loại',
      dataIndex: 'ma_loai',
      key: 'ma_loai',
      width: 140,
      render: (text: string) => <Tag color="blue" className="font-mono font-medium">{text}</Tag>,
    },
    {
      title: 'Tên Loại Hồ Sơ',
      dataIndex: 'ten_loai',
      key: 'ten_loai',
      render: (text: string, record: LoaiHoSoItem) => (
        <div>
          <div className="font-semibold text-gray-800">{text}</div>
          {record.mo_ta && <div className="text-xs text-gray-400 mt-0.5">{record.mo_ta}</div>}
        </div>
      ),
    },
    {
      title: 'Mốc Cảnh Báo Sắp Hết Hạn',
      key: 'canh_bao',
      width: 220,
      render: (record: LoaiHoSoItem) => {
        const val = record.thoi_gian_canh_bao ?? 6;
        const unit = record.don_vi_canh_bao === 'NGAY' ? 'Ngày' : 'Tháng';
        const isDefault = val === 6 && record.don_vi_canh_bao !== 'NGAY';

        return (
          <Space>
            <Tag 
              icon={<ClockCircleOutlined />} 
              color={isDefault ? 'orange' : 'volcano'}
              className="px-2.5 py-1 text-sm font-semibold rounded-md"
            >
              Trước {val} {unit}
            </Tag>
          </Space>
        );
      },
    },
    {
      title: 'Quy tắc kích hoạt',
      key: 'quy_tac',
      render: (record: LoaiHoSoItem) => {
        const val = record.thoi_gian_canh_bao ?? 6;
        const unit = record.don_vi_canh_bao === 'NGAY' ? 'ngày' : 'tháng';
        return (
          <Text type="secondary" className="text-xs">
            Chuyển trạng thái <strong>&quot;Sắp hết hạn&quot;</strong> và gửi email cảnh báo trước {val} {unit} so với ngày hết hạn.
          </Text>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 130,
      align: 'center' as const,
      render: (record: LoaiHoSoItem) => (
        <Button 
          type="primary" 
          ghost 
          size="small"
          icon={<EditOutlined />} 
          onClick={() => handleOpenEdit(record)}
        >
          Cấu hình
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="rounded-xl border border-gray-200 shadow-sm" styles={{ body: { padding: '24px' } }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <Title level={4} className="!m-0 text-gray-800 flex items-center gap-2">
              <DatabaseOutlined className="text-blue-500" />
              Cấu hình Hạn & Danh mục Loại Hồ Sơ
            </Title>
            <Text type="secondary" className="text-sm">
              Tùy chỉnh thời gian tính mốc &quot;Sắp hết hạn&quot; riêng biệt cho từng loại hồ sơ (Thuốc, Mỹ phẩm, Thiết bị y tế,...).
            </Text>
          </div>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchLoaiHoSo} 
            loading={loading}
          >
            Làm mới
          </Button>
        </div>

        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={8}>
            <Card className="border-emerald-100 bg-emerald-50/50" size="small">
              <Statistic
                title={<span className="font-semibold text-gray-600">Tổng Số Loại Hồ Sơ</span>}
                value={loaiHoSoList.length}
                prefix={<TagsOutlined className="text-emerald-500 mr-2" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={16}>
            <Alert
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
              message="Cơ chế hoạt động mốc nhắc hạn động"
              description="Hệ thống tự động sử dụng mốc thời gian cảnh báo được cấu hình dưới đây khi người dùng Thêm mới / Cập nhật / Gia hạn / Cấp số hồ sơ và trong quy trình quét tự động hàng ngày (0h00)."
            />
          </Col>
        </Row>

        {/* Table Loại Hồ Sơ & Cấu hình Hạn */}
        <Table
          columns={columns}
          dataSource={loaiHoSoList}
          rowKey="id"
          loading={loading}
          pagination={false}
          bordered
          className="shadow-sm"
        />
      </Card>

      {/* Modal Chỉnh Sửa Cấu Hình Cảnh Báo Hạn */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-base font-bold text-gray-800">
            <ClockCircleOutlined className="text-orange-500" />
            Cấu hình mốc &quot;Sắp hết hạn&quot; - {selectedLoai?.ten_loai}
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
        width={560}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          className="mt-4"
        >
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 flex orientation-row justify-between items-center">
            <div>
              <span className="text-xs text-gray-400 block">Mã loại hồ sơ</span>
              <span className="font-mono font-bold text-blue-600">{selectedLoai?.ma_loai}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 block">Tên loại hồ sơ</span>
              <span className="font-semibold text-gray-700">{selectedLoai?.ten_loai}</span>
            </div>
          </div>

          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                name="thoi_gian_canh_bao"
                label="Thời gian cảnh báo trước hạn"
                rules={[
                  { required: true, message: 'Vui lòng nhập thời gian' },
                  { type: 'number', min: 1, max: 365, message: 'Thời gian từ 1 đến 365' }
                ]}
              >
                <InputNumber 
                  className="w-full" 
                  min={1} 
                  max={365} 
                  placeholder="Ví dụ: 6" 
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                name="don_vi_canh_bao"
                label="Đơn vị tính"
                rules={[{ required: true, message: 'Vui lòng chọn đơn vị' }]}
              >
                <Select size="large">
                  <Select.Option value="THANG">Tháng (Dương lịch)</Select.Option>
                  <Select.Option value="NGAY">Ngày</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Interactive Preview Box */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg mb-5">
            <div className="text-xs font-semibold text-amber-800 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
              <CalendarOutlined /> Minh họa thời gian thực
            </div>
            <div className="text-xs text-amber-900 leading-relaxed">
              Nếu hồ sơ có ngày hết hạn là <strong className="underline">{preview.expiryStr}</strong>:
              <br />
              👉 Hệ thống sẽ chuyển trạng thái sang <strong>&quot;Sắp hết hạn&quot;</strong> và gửi email thông báo từ ngày: <strong className="text-red-600 bg-white px-1.5 py-0.5 rounded border border-amber-300">{preview.reminderStr}</strong> (trước {formThoiGian} {formDonVi === 'NGAY' ? 'ngày' : 'tháng'}).
            </div>
          </div>

          <Divider className="!my-4" />

          <Form.Item
            name="dong_bo_tat_ca"
            valuePropName="checked"
            className="!mb-4"
          >
            <div className="flex items-start gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
              <Switch defaultChecked />
              <div>
                <span className="font-semibold text-gray-800 text-sm block">Đồng bộ lại trạng thái toàn bộ hồ sơ hiện có</span>
                <span className="text-xs text-gray-500">
                  Khi bật, hệ thống sẽ tính lại ngay ngày nhắc hạn và trạng thái cho toàn bộ hồ sơ thuộc loại <strong>{selectedLoai?.ten_loai}</strong> đang có trong cơ sở dữ liệu.
                </span>
              </div>
            </div>
          </Form.Item>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={submitting} 
              icon={<SyncOutlined />}
            >
              Lưu & Áp dụng cấu hình
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
