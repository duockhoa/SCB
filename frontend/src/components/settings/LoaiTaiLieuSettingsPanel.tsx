'use client';

import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  InputNumber,
  Select,
  Switch,
  Input,
  Typography,
  Alert,
  Statistic,
  Row,
  Col,
  Popconfirm,
  Tooltip,
  App,
} from 'antd';
import {
  FileTextOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  LockOutlined,
} from '@ant-design/icons';
import {
  useLoaiHoSoList,
  useLoaiTaiLieuList,
  useCreateLoaiTaiLieu,
  useUpdateLoaiTaiLieu,
  useDeleteLoaiTaiLieu,
} from '@/hooks/queries/useDanhMuc';
import { usePermissions } from '@/hooks/usePermissions';
import type { CustomFieldConfig, LoaiHoSo, LoaiTaiLieu } from '@/types/ho-so.type';
import {
  LOAI_HO_SO_COLORS,
  getLoaiHoSoAntdColor,
  toMaLoaiCode,
} from '@/utils/loai-ho-so';
import CustomFieldsBuilder, { cleanCustomFieldsPayload } from './CustomFieldsBuilder';

const { Title, Text } = Typography;

interface LoaiTaiLieuFormValues {
  ma_loai_tai_lieu?: string;
  ten_loai_tai_lieu?: string;
  mo_ta?: string;
  mau_sac?: string;
  thu_tu?: number;
  trang_thai?: boolean;
  ap_dung_tat_ca?: boolean;
  loai_ho_so_ids?: number[];
  cau_hinh_truong?: CustomFieldConfig[];
}

interface ApiErrorLike {
  response?: { data?: { message?: string | string[] } };
}

function getApiErrorMessage(error: unknown, fallback: string) {
  const msg = (error as ApiErrorLike)?.response?.data?.message;
  return Array.isArray(msg) ? msg.join(', ') : msg || fallback;
}

export default function LoaiTaiLieuSettingsPanel() {
  const { message } = App.useApp();
  const { canDanhMucCreate, canDanhMucUpdate, canDanhMucDelete } = usePermissions();

  const { data: loaiHoSoRes } = useLoaiHoSoList(true);
  const loaiHoSoList: LoaiHoSo[] = loaiHoSoRes?.data || [];

  const { data: resData, isLoading, refetch } = useLoaiTaiLieuList({ includeInactive: true });
  const { mutateAsync: createLoaiTaiLieu, isPending: creating } = useCreateLoaiTaiLieu();
  const { mutateAsync: updateLoaiTaiLieu, isPending: updating } = useUpdateLoaiTaiLieu();
  const { mutateAsync: deleteLoaiTaiLieu, isPending: deleting } = useDeleteLoaiTaiLieu();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [crudMode, setCrudMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<LoaiTaiLieu | null>(null);
  const [maManuallyEdited, setMaManuallyEdited] = useState(false);
  const [form] = Form.useForm<LoaiTaiLieuFormValues>();

  const apDungTatCaWatch = Form.useWatch('ap_dung_tat_ca', form);
  const list: LoaiTaiLieu[] = resData?.data || [];
  const activeCount = list.filter((item) => item.trang_thai !== false).length;

  const handleOpenCreate = () => {
    setCrudMode('create');
    setEditingItem(null);
    setMaManuallyEdited(false);
    form.resetFields();
    form.setFieldsValue({
      thu_tu: list.length + 1,
      trang_thai: true,
      mau_sac: 'blue',
      ap_dung_tat_ca: true,
      loai_ho_so_ids: [],
      cau_hinh_truong: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: LoaiTaiLieu) => {
    setCrudMode('edit');
    setEditingItem(record);
    setMaManuallyEdited(true);
    form.resetFields();
    form.setFieldsValue({
      ma_loai_tai_lieu: record.ma_loai_tai_lieu,
      ten_loai_tai_lieu: record.ten_loai_tai_lieu,
      mo_ta: record.mo_ta || '',
      mau_sac: record.mau_sac || getLoaiHoSoAntdColor(record.ma_loai_tai_lieu),
      thu_tu: record.thu_tu ?? 0,
      trang_thai: record.trang_thai !== false,
      ap_dung_tat_ca: record.ap_dung_tat_ca !== false,
      loai_ho_so_ids: record.loai_ho_so_ids || [],
      cau_hinh_truong: Array.isArray(record.cau_hinh_truong) ? record.cau_hinh_truong : [],
    });
    setIsModalOpen(true);
  };

  const handleSave = async (values: LoaiTaiLieuFormValues) => {
    const cleanedFields = cleanCustomFieldsPayload(values.cau_hinh_truong);
    const apDungTatCa = values.ap_dung_tat_ca !== false;

    const basePayload = {
      ten_loai_tai_lieu: values.ten_loai_tai_lieu?.trim(),
      mo_ta: values.mo_ta?.trim() || null,
      mau_sac: values.mau_sac || null,
      thu_tu: values.thu_tu ?? 0,
      trang_thai: values.trang_thai ?? true,
      ap_dung_tat_ca: apDungTatCa,
      loai_ho_so_ids: apDungTatCa ? [] : values.loai_ho_so_ids || [],
      cau_hinh_truong: cleanedFields,
    };

    try {
      if (crudMode === 'create') {
        await createLoaiTaiLieu({
          ma_loai_tai_lieu: values.ma_loai_tai_lieu?.trim().toUpperCase(),
          ...basePayload,
        });
        message.success('Thêm mới loại tài liệu thành công!');
      } else if (editingItem) {
        const canChangeCode = !editingItem.is_system && (editingItem.so_luong_tai_lieu ?? 0) === 0;
        await updateLoaiTaiLieu({
          id: editingItem.id,
          data: canChangeCode
            ? { ma_loai_tai_lieu: values.ma_loai_tai_lieu?.trim().toUpperCase(), ...basePayload }
            : basePayload,
        });
        message.success('Cập nhật loại tài liệu thành công!');
      }
      setIsModalOpen(false);
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, 'Lỗi khi lưu loại tài liệu'));
    }
  };

  const handleDelete = async (record: LoaiTaiLieu) => {
    try {
      await deleteLoaiTaiLieu(record.id);
      message.success(`Đã xóa loại tài liệu "${record.ten_loai_tai_lieu}"`);
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, 'Không thể xóa loại tài liệu'));
    }
  };

  const columns = [
    {
      title: 'Thứ tự',
      dataIndex: 'thu_tu',
      key: 'thu_tu',
      width: 75,
      align: 'center' as const,
      render: (val: number) => <span className="font-semibold text-gray-500">{val}</span>,
    },
    {
      title: 'Tên Loại Tài Liệu',
      dataIndex: 'ten_loai_tai_lieu',
      key: 'ten_loai_tai_lieu',
      render: (text: string, record: LoaiTaiLieu) => (
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Tag
              color={getLoaiHoSoAntdColor(record.ma_loai_tai_lieu, record.mau_sac)}
              className="font-semibold m-0 px-2.5 py-0.5 text-xs"
            >
              {text}
            </Tag>
            {record.is_system && (
              <Tag color="blue" className="text-[11px] m-0">
                Mặc định hệ thống
              </Tag>
            )}
          </div>
          {record.mo_ta && (
            <div className="text-xs text-gray-400 mt-1 line-clamp-1">{record.mo_ta}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Mã Định Danh',
      dataIndex: 'ma_loai_tai_lieu',
      key: 'ma_loai_tai_lieu',
      width: 170,
      render: (code: string) => <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">{code}</code>,
    },
    {
      title: 'Áp dụng cho Loại hồ sơ',
      key: 'pham_vi',
      width: 240,
      render: (record: LoaiTaiLieu) => {
        if (record.ap_dung_tat_ca !== false) {
          return (
            <Tag color="cyan" className="m-0">
              Tất cả loại hồ sơ
            </Tag>
          );
        }
        const applied = record.loai_ho_so_list || [];
        if (applied.length === 0) {
          return <Text type="secondary" className="text-xs italic">Chưa gán loại hồ sơ</Text>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {applied.map((lhs) => (
              <Tag
                key={lhs.id}
                color={getLoaiHoSoAntdColor(lhs.ma_loai, lhs.mau_sac)}
                className="text-[11px] m-0"
              >
                {lhs.ten_loai}
              </Tag>
            ))}
          </div>
        );
      },
    },
    {
      title: 'Trường thông tin động',
      key: 'truong_dong',
      width: 170,
      render: (record: LoaiTaiLieu) => {
        const count = Array.isArray(record.cau_hinh_truong) ? record.cau_hinh_truong.length : 0;
        return count > 0 ? (
          <Tag color="geekblue" className="text-[11px] m-0">
            {count} trường tùy chỉnh
          </Tag>
        ) : (
          <Tag color="default" className="text-[11px] m-0">
            Thông tin cơ bản
          </Tag>
        );
      },
    },
    {
      title: 'Số tài liệu',
      dataIndex: 'so_luong_tai_lieu',
      key: 'so_luong_tai_lieu',
      width: 100,
      align: 'center' as const,
      render: (val: number) => (
        <Tag color={val > 0 ? 'blue' : 'default'} className="font-semibold m-0">
          {val ?? 0}
        </Tag>
      ),
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
      width: 170,
      align: 'center' as const,
      render: (record: LoaiTaiLieu) => {
        const cannotDeleteReason = record.is_system
          ? 'Không thể xóa loại tài liệu mặc định hệ thống'
          : (record.so_luong_tai_lieu ?? 0) > 0
            ? `Đang có ${record.so_luong_tai_lieu} tài liệu sử dụng. Hãy chuyển sang Ngưng hoạt động.`
            : '';

        return (
          <Space size="small">
            {canDanhMucUpdate && (
              <Button
                type="primary"
                ghost
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleOpenEdit(record)}
              >
                Sửa
              </Button>
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
                  title="Xóa loại tài liệu"
                  description={`Bạn có chắc muốn xóa loại "${record.ten_loai_tai_lieu}" không?`}
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

  const isCodeLocked =
    crudMode === 'edit' &&
    Boolean(editingItem?.is_system || (editingItem?.so_luong_tai_lieu ?? 0) > 0);

  return (
    <Card className="rounded-xl border border-gray-200 shadow-sm" styles={{ body: { padding: '24px' } }}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <Title level={4} className="!m-0 text-gray-800 flex items-center gap-2">
            <FileTextOutlined className="text-indigo-500" />
            Cấu hình Danh mục Loại Tài Liệu theo Loại Hồ Sơ
          </Title>
          <Text type="secondary" className="text-sm">
            Phân loại tài liệu đính kèm theo từng nhóm hồ sơ và định nghĩa các trường dữ liệu riêng (Số công văn, Ngày ban hành, Cơ quan cấp...) cho từng nhóm.
          </Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading}>
            Làm mới
          </Button>
          {canDanhMucCreate && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
              Thêm loại tài liệu
            </Button>
          )}
        </Space>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card className="border-indigo-100 bg-indigo-50/50" size="small">
            <Statistic
              title={<span className="font-semibold text-gray-600">Loại Tài Liệu Đang Hoạt Động</span>}
              value={activeCount}
              suffix={<span className="text-sm text-gray-400">/ {list.length}</span>}
              prefix={<FileTextOutlined className="text-indigo-500 mr-2" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={16}>
          <Alert
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            message="Loại tài liệu & Trường tài liệu động"
            description="Mỗi loại tài liệu có thể áp dụng cho tất cả hoặc chỉ một vài Loại hồ sơ cụ thể, đồng thời kèm bộ trường nhập liệu động riêng khi đính kèm tài liệu vào hồ sơ."
          />
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={list}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        scroll={{ x: 1050 }}
        className="border border-gray-100 rounded-lg overflow-hidden"
      />

      <Modal
        title={
          <div className="flex items-center gap-2">
            <FileTextOutlined className="text-indigo-500" />
            <span>
              {crudMode === 'create'
                ? 'Thêm mới Loại Tài Liệu'
                : `Chỉnh sửa Loại Tài Liệu: ${editingItem?.ten_loai_tai_lieu}`}
            </span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={creating || updating}
        okText={crudMode === 'create' ? 'Tạo loại tài liệu' : 'Lưu thay đổi'}
        cancelText="Hủy"
        width={860}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="ten_loai_tai_lieu"
                label="Tên loại tài liệu"
                rules={[{ required: true, message: 'Vui lòng nhập tên loại tài liệu' }]}
              >
                <Input
                  placeholder="VD: Phiếu kiểm nghiệm, Công văn phê duyệt..."
                  onChange={(e) => {
                    if (crudMode === 'create' && !maManuallyEdited) {
                      form.setFieldValue('ma_loai_tai_lieu', toMaLoaiCode(e.target.value));
                    }
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="ma_loai_tai_lieu"
                label={
                  <span className="flex items-center gap-1">
                    Mã loại tài liệu
                    {isCodeLocked && (
                      <Tooltip title="Không thể đổi mã của loại mặc định hoặc đã có tài liệu sử dụng">
                        <LockOutlined className="text-gray-400 text-xs" />
                      </Tooltip>
                    )}
                  </span>
                }
                rules={[
                  { required: true, message: 'Vui lòng nhập mã loại tài liệu' },
                  {
                    pattern: /^[A-Za-z0-9_]+$/,
                    message: 'Chỉ gồm chữ không dấu (A-Z), số (0-9) và gạch dưới (_)',
                  },
                ]}
              >
                <Input
                  placeholder="VD: PHIEU_KIEM_NGHIEM"
                  disabled={isCodeLocked}
                  onChange={(e) => {
                    setMaManuallyEdited(true);
                    form.setFieldValue('ma_loai_tai_lieu', e.target.value.toUpperCase());
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item name="mau_sac" label="Màu hiển thị (Badge)">
                <Select placeholder="Chọn màu" allowClear>
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

            <Col xs={12} sm={8}>
              <Form.Item name="thu_tu" label="Thứ tự hiển thị">
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>

            <Col xs={12} sm={8}>
              <Form.Item name="trang_thai" label="Trạng thái" valuePropName="checked">
                <Switch checkedChildren="Hoạt động" unCheckedChildren="Ngưng hoạt động" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item name="mo_ta" label="Mô tả ngắn">
                <Input.TextArea rows={2} placeholder="Ghi chú phạm vi hoặc hướng dẫn loại tài liệu này..." />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item
                name="ap_dung_tat_ca"
                label="Phạm vi áp dụng"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="Tất cả loại hồ sơ"
                  unCheckedChildren="Chọn theo loại hồ sơ"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={16}>
              <Form.Item
                name="loai_ho_so_ids"
                label="Loại hồ sơ áp dụng"
                rules={
                  apDungTatCaWatch === false
                    ? [{ required: true, message: 'Vui lòng chọn ít nhất 1 loại hồ sơ' }]
                    : undefined
                }
              >
                <Select
                  mode="multiple"
                  disabled={apDungTatCaWatch !== false}
                  placeholder={
                    apDungTatCaWatch !== false
                      ? 'Đang bật áp dụng cho tất cả loại hồ sơ'
                      : 'Chọn các loại hồ sơ được phép dùng loại tài liệu này...'
                  }
                  optionFilterProp="label"
                  options={loaiHoSoList.map((lhs) => ({
                    value: lhs.id,
                    label: `${lhs.ten_loai} (${lhs.ma_loai})${lhs.trang_thai === false ? ' [Ngưng]' : ''}`,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <CustomFieldsBuilder
            form={form}
            crudMode={crudMode}
            existingFields={editingItem?.cau_hinh_truong}
            dividerTitle="Cấu hình trường thông tin động cho loại tài liệu này"
            emptyText='Chưa có trường dữ liệu động nào. Bấm "Thêm trường thông tin" nếu muốn nhập thêm thông tin riêng (VD: Số công văn, Cơ quan cấp, Ngày ký...) khi tải tài liệu thuộc nhóm này.'
          />
        </Form>
      </Modal>
    </Card>
  );
}

