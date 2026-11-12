'use client';

import React, { useState } from 'react';
import {
  Card,
  Col,
  Row,
  Typography,
  Statistic,
  Table,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  message,
  Tooltip,
  Alert,
  Space,
  Divider,
  Popconfirm,
  Tabs,
} from 'antd';
import {
  DatabaseOutlined,
  TagsOutlined,
  ClockCircleOutlined,
  EditOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  SyncOutlined,
  PlusOutlined,
  DeleteOutlined,
  FormOutlined,
  LockOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { CustomFieldConfig, LoaiHoSo } from '@/types/ho-so.type';
import {
  useCreateLoaiHoSo,
  useDeleteLoaiHoSo,
  useLoaiHoSoList,
  useUpdateLoaiHoSo,
  useUpdateLoaiHoSoExpiry,
} from '@/hooks/queries/useDanhMuc';
import { usePermissions } from '@/hooks/usePermissions';
import {
  getLoaiHoSoAntdColor,
  LOAI_HO_SO_COLORS,
  SYSTEM_BUILT_IN_FIELDS_SUMMARY,
  toMaLoaiCode,
} from '@/utils/loai-ho-so';
import CustomFieldsBuilder, { cleanCustomFieldsPayload } from './CustomFieldsBuilder';
import LoaiTaiLieuSettingsPanel from './LoaiTaiLieuSettingsPanel';

const { Title, Text } = Typography;

export default function DanhMucSettingsTab() {
  const { canDanhMucCreate, canDanhMucUpdate, canDanhMucDelete } = usePermissions();

  const { data: loaiHoSoRes, isLoading, refetch } = useLoaiHoSoList(true);
  const loaiHoSoList: LoaiHoSo[] = loaiHoSoRes?.data || [];

  const { mutateAsync: createLoaiHoSo, isPending: creating } = useCreateLoaiHoSo();
  const { mutateAsync: updateLoaiHoSo, isPending: updating } = useUpdateLoaiHoSo();
  const { mutateAsync: deleteLoaiHoSo, isPending: deleting } = useDeleteLoaiHoSo();
  const { mutateAsync: updateLoaiHoSoExpiry, isPending: updatingExpiry } = useUpdateLoaiHoSoExpiry();

  // Modal Cấu hình hạn
  const [isExpiryModalOpen, setIsExpiryModalOpen] = useState(false);
  const [selectedLoaiForExpiry, setSelectedLoaiForExpiry] = useState<LoaiHoSo | null>(null);
  const [expiryForm] = Form.useForm();
  const formThoiGian = Form.useWatch('thoi_gian_canh_bao', expiryForm) || 6;
  const formDonVi = Form.useWatch('don_vi_canh_bao', expiryForm) || 'THANG';

  // Modal Thêm / Sửa Loại hồ sơ
  const [isCrudModalOpen, setIsCrudModalOpen] = useState(false);
  const [crudMode, setCrudMode] = useState<'create' | 'edit'>('create');
  const [editingLoai, setEditingLoai] = useState<LoaiHoSo | null>(null);
  const [maLoaiEdited, setMaLoaiEdited] = useState(false);
  const [crudForm] = Form.useForm();

  const handleOpenCreate = () => {
    setCrudMode('create');
    setEditingLoai(null);
    setMaLoaiEdited(false);
    const maxOrder = loaiHoSoList.reduce((max, item) => Math.max(max, item.thu_tu ?? 0), 0);
    crudForm.setFieldsValue({
      ten_loai: '',
      ma_loai: '',
      mo_ta: '',
      mau_sac: 'blue',
      thu_tu: maxOrder + 1,
      trang_thai: true,
      thoi_gian_canh_bao: 6,
      don_vi_canh_bao: 'THANG',
      cau_hinh_truong: [],
    });
    setIsCrudModalOpen(true);
  };

  const handleOpenCrudEdit = (record: LoaiHoSo) => {
    setCrudMode('edit');
    setEditingLoai(record);
    setMaLoaiEdited(true);
    crudForm.setFieldsValue({
      ten_loai: record.ten_loai,
      ma_loai: record.ma_loai,
      mo_ta: record.mo_ta || '',
      mau_sac: record.mau_sac || getLoaiHoSoAntdColor(record.ma_loai, record.mau_sac),
      thu_tu: record.thu_tu ?? 0,
      trang_thai: record.trang_thai !== false,
      thoi_gian_canh_bao: record.thoi_gian_canh_bao ?? 6,
      don_vi_canh_bao: record.don_vi_canh_bao || 'THANG',
      cau_hinh_truong: Array.isArray(record.cau_hinh_truong) ? record.cau_hinh_truong : [],
    });
    setIsCrudModalOpen(true);
  };

  interface CrudFormValues {
    ma_loai?: string;
    ten_loai?: string;
    mo_ta?: string;
    mau_sac?: string;
    thu_tu?: number;
    trang_thai?: boolean;
    thoi_gian_canh_bao?: number;
    don_vi_canh_bao?: string;
    cau_hinh_truong?: CustomFieldConfig[];
  }

  interface ApiErrorLike {
    response?: { data?: { message?: string | string[] } };
  }

  const getApiErrorMessage = (error: unknown, fallback: string) => {
    const msg = (error as ApiErrorLike)?.response?.data?.message;
    return Array.isArray(msg) ? msg.join(', ') : msg || fallback;
  };

  const handleSaveCrud = async (values: CrudFormValues) => {
    const cleanedFields = cleanCustomFieldsPayload(values.cau_hinh_truong);

    const basePayload = {
      ten_loai: values.ten_loai?.trim(),
      mo_ta: values.mo_ta?.trim() || null,
      mau_sac: values.mau_sac || null,
      thu_tu: values.thu_tu ?? 0,
      trang_thai: values.trang_thai ?? true,
      thoi_gian_canh_bao: values.thoi_gian_canh_bao ?? 6,
      don_vi_canh_bao: values.don_vi_canh_bao || 'THANG',
      cau_hinh_truong: cleanedFields,
    };

    try {
      if (crudMode === 'create') {
        await createLoaiHoSo({
          ma_loai: values.ma_loai?.trim().toUpperCase(),
          ...basePayload,
        });
        message.success('Thêm mới loại hồ sơ thành công!');
      } else if (editingLoai) {
        const canChangeCode = !editingLoai.is_system && (editingLoai.so_luong_ho_so ?? 0) === 0;
        await updateLoaiHoSo({
          id: editingLoai.id,
          data: canChangeCode
            ? { ma_loai: values.ma_loai?.trim().toUpperCase(), ...basePayload }
            : basePayload,
        });
        message.success('Cập nhật loại hồ sơ thành công!');
      }
      setIsCrudModalOpen(false);
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, 'Lỗi khi lưu loại hồ sơ'));
    }
  };

  const handleDelete = async (record: LoaiHoSo) => {
    try {
      await deleteLoaiHoSo(record.id);
      message.success(`Đã xóa loại hồ sơ "${record.ten_loai}"`);
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, 'Không thể xóa loại hồ sơ'));
    }
  };

  const handleOpenExpiryEdit = (record: LoaiHoSo) => {
    setSelectedLoaiForExpiry(record);
    expiryForm.setFieldsValue({
      thoi_gian_canh_bao: record.thoi_gian_canh_bao ?? 6,
      don_vi_canh_bao: record.don_vi_canh_bao || 'THANG',
      dong_bo_tat_ca: true,
    });
    setIsExpiryModalOpen(true);
  };

  const handleSaveExpiry = async (values: { thoi_gian_canh_bao: number; don_vi_canh_bao: string; dong_bo_tat_ca: boolean }) => {
    if (!selectedLoaiForExpiry) return;
    try {
      const res = await updateLoaiHoSoExpiry({
        id: selectedLoaiForExpiry.id,
        data: {
          thoi_gian_canh_bao: values.thoi_gian_canh_bao,
          don_vi_canh_bao: values.don_vi_canh_bao,
          dong_bo_tat_ca: values.dong_bo_tat_ca,
        },
      });
      const syncCount = res.data?.syncCount || 0;
      message.success(
        `Cập nhật cấu hình thành công! ${values.dong_bo_tat_ca ? `Đã đồng bộ cập nhật ${syncCount} hồ sơ hiện có.` : ''}`,
      );
      setIsExpiryModalOpen(false);
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, 'Lỗi khi lưu cấu hình'));
    }
  };

  const getPreviewDate = () => {
    const sampleExpiry = new Date();
    sampleExpiry.setFullYear(sampleExpiry.getFullYear() + 1);
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
  const isCodeLocked =
    crudMode === 'edit' && Boolean(editingLoai?.is_system || (editingLoai?.so_luong_ho_so ?? 0) > 0);
  const builtInSummary = editingLoai?.ma_loai
    ? SYSTEM_BUILT_IN_FIELDS_SUMMARY[editingLoai.ma_loai]
    : undefined;

  const activeCount = loaiHoSoList.filter((l) => l.trang_thai !== false).length;

  const columns = [
    {
      title: 'STT',
      dataIndex: 'thu_tu',
      key: 'thu_tu',
      width: 65,
      align: 'center' as const,
      render: (val: number) => <span className="text-gray-500 font-medium">{val ?? 0}</span>,
    },
    {
      title: 'Mã loại',
      dataIndex: 'ma_loai',
      key: 'ma_loai',
      width: 185,
      render: (text: string, record: LoaiHoSo) => (
        <div className="flex flex-col gap-1 items-start">
          <Tag
            color={getLoaiHoSoAntdColor(record.ma_loai, record.mau_sac)}
            className="font-mono font-medium m-0"
          >
            {text}
          </Tag>
          {record.is_system && (
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <LockOutlined /> Mặc định hệ thống
            </span>
          )}
        </div>
      ),
    },
    {
      title: 'Tên Loại Hồ Sơ & Trường đặc thù',
      dataIndex: 'ten_loai',
      key: 'ten_loai',
      render: (text: string, record: LoaiHoSo) => {
        const customFields = Array.isArray(record.cau_hinh_truong) ? record.cau_hinh_truong : [];
        return (
          <div>
            <div className="font-semibold text-gray-800">{text}</div>
            {record.mo_ta && <div className="text-xs text-gray-400 mt-0.5">{record.mo_ta}</div>}
            <div className="mt-1 flex flex-wrap gap-1">
              {record.is_system && (
                <Tag color="default" className="text-[11px] m-0">
                  Biểu mẫu chuẩn hệ thống
                </Tag>
              )}
              {customFields.length > 0 && (
                <Tag color="geekblue" className="text-[11px] m-0">
                  +{customFields.length} trường tùy chỉnh
                </Tag>
              )}
              {!record.is_system && customFields.length === 0 && (
                <Tag color="default" className="text-[11px] m-0">
                  Chỉ dùng thông tin chung
                </Tag>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Số hồ sơ',
      dataIndex: 'so_luong_ho_so',
      key: 'so_luong_ho_so',
      width: 95,
      align: 'center' as const,
      render: (val: number) => (
        <Tag color={val > 0 ? 'blue' : 'default'} className="font-semibold m-0">
          {val ?? 0}
        </Tag>
      ),
    },
    {
      title: 'Mốc Cảnh Báo',
      key: 'canh_bao',
      width: 155,
      render: (record: LoaiHoSo) => {
        const val = record.thoi_gian_canh_bao ?? 6;
        const unit = record.don_vi_canh_bao === 'NGAY' ? 'Ngày' : 'Tháng';
        const isDefault = val === 6 && record.don_vi_canh_bao !== 'NGAY';

        return (
          <Tag
            icon={<ClockCircleOutlined />}
            color={isDefault ? 'orange' : 'volcano'}
            className="px-2 py-0.5 text-xs font-semibold rounded-md m-0"
          >
            Trước {val} {unit}
          </Tag>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trang_thai',
      key: 'trang_thai',
      width: 130,
      align: 'center' as const,
      render: (val: boolean) =>
        val !== false ? (
          <Tag color="success" className="m-0">
            Hoạt động
          </Tag>
        ) : (
          <Tag color="default" className="m-0">
            Ngưng hoạt động
          </Tag>
        ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 240,
      align: 'center' as const,
      render: (record: LoaiHoSo) => {
        const cannotDeleteReason = record.is_system
          ? 'Không thể xóa loại hồ sơ mặc định hệ thống'
          : (record.so_luong_ho_so ?? 0) > 0
            ? `Đang có ${record.so_luong_ho_so} hồ sơ sử dụng. Hãy chuyển sang Ngưng hoạt động.`
            : '';

        return (
          <Space size="small">
            {canDanhMucUpdate && (
              <>
                <Button
                  type="primary"
                  ghost
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleOpenCrudEdit(record)}
                >
                  Sửa
                </Button>
                <Tooltip title="Cấu hình mốc cảnh báo hết hạn">
                  <Button
                    size="small"
                    icon={<ClockCircleOutlined />}
                    onClick={() => handleOpenExpiryEdit(record)}
                  >
                    Hạn
                  </Button>
                </Tooltip>
              </>
            )}
            {canDanhMucDelete && (
              cannotDeleteReason ? (
                <Tooltip title={cannotDeleteReason}>
                  <Button size="small" danger icon={<DeleteOutlined />} disabled>
                    Xóa
                  </Button>
                </Tooltip>
              ) : (
                <Popconfirm
                  title="Xóa loại hồ sơ"
                  description={`Bạn có chắc muốn xóa loại "${record.ten_loai}" không?`}
                  onConfirm={() => handleDelete(record)}
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true, loading: deleting }}
                >
                  <Button size="small" danger icon={<DeleteOutlined />}>
                    Xóa
                  </Button>
                </Popconfirm>
              )
            )}
          </Space>
        );
      },
    },
  ];

  const loaiHoSoSection = (
    <div className="space-y-6">
      <Card className="rounded-xl border border-gray-200 shadow-sm" styles={{ body: { padding: '16px 20px' } }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <Title level={4} className="!m-0 text-gray-800 flex items-center gap-2">
              <DatabaseOutlined className="text-blue-500" />
              Cấu hình Danh mục Loại Hồ Sơ & Mốc Cảnh Báo Hạn
            </Title>
            <Text type="secondary" className="text-sm">
              Thêm mới, đổi tên, thiết lập trường thông tin đặc thù động và mốc cảnh báo &quot;Sắp hết hạn&quot; cho từng loại hồ sơ.
            </Text>
          </div>
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading}>
              Làm mới
            </Button>
            {canDanhMucCreate && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
                Thêm loại hồ sơ
              </Button>
            )}
          </Space>
        </div>

        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={8}>
            <Card className="border-emerald-100 bg-emerald-50/50" size="small">
              <Statistic
                title={<span className="font-semibold text-gray-600">Loại Hồ Sơ Đang Hoạt Động</span>}
                value={activeCount}
                suffix={<span className="text-sm text-gray-400">/ {loaiHoSoList.length}</span>}
                prefix={<TagsOutlined className="text-emerald-500 mr-2" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={16}>
            <Alert
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
              message="Cấu hình động Loại hồ sơ & Trường đặc thù"
              description="Bạn có thể đổi tên bất kỳ loại hồ sơ nào, hoặc thêm mới loại hồ sơ kèm các trường nhập liệu riêng (Văn bản, Số, Ngày, Danh sách chọn, Upload File/Link). Các loại hồ sơ đã phát sinh dữ liệu có thể chuyển sang 'Ngưng hoạt động' thay vì xóa."
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={loaiHoSoList}
          rowKey="id"
          loading={isLoading}
          pagination={false}
          bordered
          scroll={{ x: 'max-content' }}
          className="shadow-sm"
        />
      </Card>

      {/* Modal Thêm / Sửa Loại Hồ Sơ + Trường đặc thù động */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-base font-bold text-gray-800">
            <FormOutlined className="text-blue-500" />
            {crudMode === 'create'
              ? 'Thêm mới Loại Hồ Sơ'
              : `Chỉnh sửa Loại Hồ Sơ - ${editingLoai?.ten_loai}`}
          </div>
        }
        open={isCrudModalOpen}
        onCancel={() => setIsCrudModalOpen(false)}
        footer={null}
        destroyOnHidden
        width={820}
        style={{ maxWidth: 'calc(100vw - 24px)' }}
        styles={{ body: { maxHeight: '72dvh', overflowY: 'auto', overflowX: 'hidden' } }}
      >
        <Form form={crudForm} layout="vertical" onFinish={handleSaveCrud} className="mt-4">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="ten_loai"
                label="Tên loại hồ sơ"
                rules={[{ required: true, message: 'Vui lòng nhập tên loại hồ sơ' }]}
              >
                <Input
                  placeholder="Ví dụ: Hồ sơ thực phẩm bảo vệ sức khỏe"
                  onChange={(e) => {
                    if (crudMode === 'create' && !maLoaiEdited) {
                      crudForm.setFieldValue('ma_loai', toMaLoaiCode(e.target.value));
                    }
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="ma_loai"
                label="Mã loại (Viết hoa không dấu)"
                rules={[
                  { required: true, message: 'Vui lòng nhập mã loại' },
                  {
                    pattern: /^[A-Z0-9_]+$/,
                    message: 'Chỉ dùng chữ in hoa (A-Z), số (0-9) và dấu gạch dưới (_)',
                  },
                ]}
                extra={
                  isCodeLocked
                    ? 'Mã loại bị khóa vì đây là loại mặc định hệ thống hoặc đã có hồ sơ sử dụng'
                    : 'Ví dụ: THUC_PHAM_THUONG'
                }
              >
                <Input
                  placeholder="VD: THUC_PHAM_THUONG"
                  disabled={isCodeLocked}
                  onChange={(e) => {
                    setMaLoaiEdited(true);
                    crudForm.setFieldValue('ma_loai', e.target.value.toUpperCase());
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="mo_ta" label="Mô tả ngắn">
                <Input placeholder="Mô tả phạm vi áp dụng của loại hồ sơ..." />
              </Form.Item>
            </Col>

            <Col xs={12} sm={6}>
              <Form.Item name="mau_sac" label="Màu thẻ hiển thị">
                <Select>
                  {LOAI_HO_SO_COLORS.map((c) => (
                    <Select.Option key={c.value} value={c.value}>
                      <Tag color={c.antdColor} className="m-0">
                        {c.label}
                      </Tag>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={12} sm={6}>
              <Form.Item name="thu_tu" label="Thứ tự hiển thị">
                <InputNumber className="w-full" min={0} />
              </Form.Item>
            </Col>

            <Col xs={12} sm={8}>
              <Form.Item
                name="thoi_gian_canh_bao"
                label="Thời gian cảnh báo hạn"
                rules={[{ required: true, type: 'number', min: 1, max: 365 }]}
              >
                <InputNumber className="w-full" min={1} max={365} />
              </Form.Item>
            </Col>

            <Col xs={12} sm={8}>
              <Form.Item name="don_vi_canh_bao" label="Đơn vị cảnh báo">
                <Select>
                  <Select.Option value="THANG">Tháng (Dương lịch)</Select.Option>
                  <Select.Option value="NGAY">Ngày</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item name="trang_thai" label="Trạng thái" valuePropName="checked">
                <Switch checkedChildren="Hoạt động" unCheckedChildren="Ngưng hoạt động" />
              </Form.Item>
            </Col>
          </Row>

          {builtInSummary && (
            <Alert
              type="info"
              showIcon
              className="mb-4"
              message={`Các trường có sẵn của biểu mẫu ${editingLoai?.ma_loai}`}
              description={
                <div className="text-xs">
                  <div>
                    Hệ thống đã tích hợp sẵn: <strong>{builtInSummary.join(', ')}</strong>.
                  </div>
                  <div className="mt-1 text-gray-500">
                    Nếu cần bổ sung thêm trường mới cho loại hồ sơ này, bạn có thể khai báo ở danh sách bên dưới.
                  </div>
                </div>
              }
            />
          )}

          <CustomFieldsBuilder
            form={crudForm}
            crudMode={crudMode}
            existingFields={editingLoai?.cau_hinh_truong}
            dividerTitle="Cấu hình Trường Thông Tin Đặc Thù"
            emptyText='Chưa có trường đặc thù tùy chỉnh nào. Bấm "Thêm trường thông tin đặc thù" bên dưới nếu loại hồ sơ này cần nhập dữ liệu riêng.'
            addButtonText="Thêm trường thông tin đặc thù"
          />

          <div className="flex justify-end gap-2 pt-5 mt-4 border-t border-gray-100">
            <Button onClick={() => setIsCrudModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={creating || updating}>
              {crudMode === 'create' ? 'Tạo loại hồ sơ' : 'Lưu thay đổi'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal Chỉnh Sửa Cấu Hình Cảnh Báo Hạn */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-base font-bold text-gray-800">
            <ClockCircleOutlined className="text-orange-500" />
            Cấu hình mốc &quot;Sắp hết hạn&quot; - {selectedLoaiForExpiry?.ten_loai}
          </div>
        }
        open={isExpiryModalOpen}
        onCancel={() => setIsExpiryModalOpen(false)}
        footer={null}
        destroyOnHidden
        width={560}
        style={{ maxWidth: 'calc(100vw - 24px)' }}
      >
        <Form form={expiryForm} layout="vertical" onFinish={handleSaveExpiry} className="mt-4">
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center">
            <div>
              <span className="text-xs text-gray-400 block">Mã loại hồ sơ</span>
              <span className="font-mono font-bold text-blue-600">{selectedLoaiForExpiry?.ma_loai}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 block">Tên loại hồ sơ</span>
              <span className="font-semibold text-gray-700">{selectedLoaiForExpiry?.ten_loai}</span>
            </div>
          </div>

          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                name="thoi_gian_canh_bao"
                label="Thời gian cảnh báo trước hạn"
                rules={[
                  { required: true, message: 'Vui lòng nhập thời gian' },
                  { type: 'number', min: 1, max: 365, message: 'Thời gian từ 1 đến 365' },
                ]}
              >
                <InputNumber className="w-full" min={1} max={365} placeholder="Ví dụ: 6" size="large" />
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

          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg mb-5">
            <div className="text-xs font-semibold text-amber-800 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
              <CalendarOutlined /> Minh họa thời gian thực
            </div>
            <div className="text-xs text-amber-900 leading-relaxed">
              Nếu hồ sơ có ngày hết hạn là <strong className="underline">{preview.expiryStr}</strong>:
              <br />
              👉 Hệ thống sẽ chuyển trạng thái sang <strong>&quot;Sắp hết hạn&quot;</strong> và gửi email thông báo từ ngày:{' '}
              <strong className="text-red-600 bg-white px-1.5 py-0.5 rounded border border-amber-300">
                {preview.reminderStr}
              </strong>{' '}
              (trước {formThoiGian} {formDonVi === 'NGAY' ? 'ngày' : 'tháng'}).
            </div>
          </div>

          <Divider className="!my-4" />

          <Form.Item name="dong_bo_tat_ca" valuePropName="checked" className="!mb-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
              <Switch defaultChecked />
              <div>
                <span className="font-semibold text-gray-800 text-sm block">
                  Đồng bộ lại trạng thái toàn bộ hồ sơ hiện có
                </span>
                <span className="text-xs text-gray-500">
                  Khi bật, hệ thống sẽ tính lại ngay ngày nhắc hạn và trạng thái cho toàn bộ hồ sơ thuộc loại{' '}
                  <strong>{selectedLoaiForExpiry?.ten_loai}</strong> đang có trong cơ sở dữ liệu.
                </span>
              </div>
            </div>
          </Form.Item>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setIsExpiryModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={updatingExpiry} icon={<SyncOutlined />}>
              Lưu & Áp dụng cấu hình
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );

  return (
    <Tabs
      defaultActiveKey="loai-ho-so"
      type="card"
      items={[
        {
          key: 'loai-ho-so',
          label: (
            <span className="flex items-center gap-1.5 font-medium">
              <TagsOutlined />
              Loại hồ sơ
            </span>
          ),
          children: loaiHoSoSection,
        },
        {
          key: 'loai-tai-lieu',
          label: (
            <span className="flex items-center gap-1.5 font-medium">
              <FileTextOutlined />
              Nhóm &amp; Loại tài liệu
            </span>
          ),
          children: <LoaiTaiLieuSettingsPanel />,
        },
      ]}
    />
  );
}
