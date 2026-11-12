'use client';

import React, { useMemo, useState } from 'react';
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
  Empty,
  Collapse,
  App,
} from 'antd';
import {
  FolderOpenOutlined,
  FileTextOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import {
  useLoaiHoSoList,
  useNhomTaiLieuList,
  useCreateNhomTaiLieu,
  useUpdateNhomTaiLieu,
  useDeleteNhomTaiLieu,
  useCreateLoaiTaiLieu,
  useUpdateLoaiTaiLieu,
  useDeleteLoaiTaiLieu,
} from '@/hooks/queries/useDanhMuc';
import { usePermissions } from '@/hooks/usePermissions';
import type {
  CustomFieldConfig,
  LoaiHoSo,
  LoaiTaiLieu,
  NhomTaiLieu,
} from '@/types/ho-so.type';
import {
  LOAI_HO_SO_COLORS,
  getLoaiHoSoAntdColor,
  toMaLoaiCode,
} from '@/utils/loai-ho-so';
import CustomFieldsBuilder, { cleanCustomFieldsPayload } from './CustomFieldsBuilder';

const { Title, Text } = Typography;

interface NhomTaiLieuFormValues {
  ma_nhom?: string;
  ten_nhom?: string;
  mo_ta?: string;
  mau_sac?: string;
  thu_tu?: number;
  trang_thai?: boolean;
  ap_dung_tat_ca?: boolean;
  loai_ho_so_ids?: number[];
}

interface LoaiTaiLieuFormValues {
  nhom_tai_lieu_id?: number;
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

  const { data: nhomRes, isLoading, refetch } = useNhomTaiLieuList({ includeInactive: true });
  const groups: NhomTaiLieu[] = useMemo(() => nhomRes?.data || [], [nhomRes?.data]);

  const { mutateAsync: createNhom, isPending: creatingNhom } = useCreateNhomTaiLieu();
  const { mutateAsync: updateNhom, isPending: updatingNhom } = useUpdateNhomTaiLieu();
  const { mutateAsync: deleteNhom, isPending: deletingNhom } = useDeleteNhomTaiLieu();

  const { mutateAsync: createLoai, isPending: creatingLoai } = useCreateLoaiTaiLieu();
  const { mutateAsync: updateLoai, isPending: updatingLoai } = useUpdateLoaiTaiLieu();
  const { mutateAsync: deleteLoai, isPending: deletingLoai } = useDeleteLoaiTaiLieu();

  // State cho Modal Nhóm tài liệu
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupMode, setGroupMode] = useState<'create' | 'edit'>('create');
  const [editingGroup, setEditingGroup] = useState<NhomTaiLieu | null>(null);
  const [groupCodeEdited, setGroupCodeEdited] = useState(false);
  const [groupForm] = Form.useForm<NhomTaiLieuFormValues>();
  const groupApDungTatCa = Form.useWatch('ap_dung_tat_ca', groupForm);

  // State cho Modal Loại tài liệu
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [typeMode, setTypeMode] = useState<'create' | 'edit'>('create');
  const [editingType, setEditingType] = useState<LoaiTaiLieu | null>(null);
  const [typeCodeEdited, setTypeCodeEdited] = useState(false);
  const [typeForm] = Form.useForm<LoaiTaiLieuFormValues>();
  const typeApDungTatCa = Form.useWatch('ap_dung_tat_ca', typeForm);

  const totalTypesCount = useMemo(
    () => groups.reduce((acc, g) => acc + (g.loai_tai_lieu?.length ?? 0), 0),
    [groups],
  );
  const activeGroupsCount = groups.filter((g) => g.trang_thai !== false).length;

  // --- Handlers Nhóm tài liệu ---
  const handleOpenCreateGroup = () => {
    setGroupMode('create');
    setEditingGroup(null);
    setGroupCodeEdited(false);
    groupForm.resetFields();
    groupForm.setFieldsValue({
      thu_tu: groups.length + 1,
      trang_thai: true,
      mau_sac: 'cyan',
      ap_dung_tat_ca: true,
      loai_ho_so_ids: [],
    });
    setGroupModalOpen(true);
  };

  const handleOpenEditGroup = (group: NhomTaiLieu) => {
    setGroupMode('edit');
    setEditingGroup(group);
    setGroupCodeEdited(true);
    groupForm.resetFields();
    groupForm.setFieldsValue({
      ma_nhom: group.ma_nhom,
      ten_nhom: group.ten_nhom,
      mo_ta: group.mo_ta || '',
      mau_sac: group.mau_sac || getLoaiHoSoAntdColor(group.ma_nhom),
      thu_tu: group.thu_tu ?? 0,
      trang_thai: group.trang_thai !== false,
      ap_dung_tat_ca: group.ap_dung_tat_ca !== false,
      loai_ho_so_ids: group.loai_ho_so_ids || [],
    });
    setGroupModalOpen(true);
  };

  const handleSaveGroup = async (values: NhomTaiLieuFormValues) => {
    const apDungTatCa = values.ap_dung_tat_ca !== false;
    const basePayload = {
      ten_nhom: values.ten_nhom?.trim(),
      mo_ta: values.mo_ta?.trim() || null,
      mau_sac: values.mau_sac || null,
      thu_tu: values.thu_tu ?? 0,
      trang_thai: values.trang_thai ?? true,
      ap_dung_tat_ca: apDungTatCa,
      loai_ho_so_ids: apDungTatCa ? [] : values.loai_ho_so_ids || [],
    };

    try {
      if (groupMode === 'create') {
        await createNhom({
          ma_nhom: values.ma_nhom?.trim().toUpperCase(),
          ...basePayload,
        });
        message.success('Đã tạo nhóm tài liệu mới và cập nhật phân quyền động!');
      } else if (editingGroup) {
        const canChangeCode = !editingGroup.is_system;
        await updateNhom({
          id: editingGroup.id,
          data: canChangeCode
            ? { ma_nhom: values.ma_nhom?.trim().toUpperCase(), ...basePayload }
            : basePayload,
        });
        message.success('Cập nhật nhóm tài liệu thành công!');
      }
      setGroupModalOpen(false);
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, 'Lỗi khi lưu nhóm tài liệu'));
    }
  };

  const handleDeleteGroup = async (group: NhomTaiLieu) => {
    try {
      await deleteNhom(group.id);
      message.success(`Đã xóa nhóm tài liệu "${group.ten_nhom}"`);
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, 'Không thể xóa nhóm tài liệu'));
    }
  };

  // --- Handlers Loại tài liệu ---
  const handleOpenCreateType = (defaultGroup?: NhomTaiLieu) => {
    setTypeMode('create');
    setEditingType(null);
    setTypeCodeEdited(false);
    typeForm.resetFields();
    const targetGroup = defaultGroup || groups[0];
    const nextOrder = (targetGroup?.loai_tai_lieu?.length ?? totalTypesCount) + 1;
    typeForm.setFieldsValue({
      nhom_tai_lieu_id: targetGroup?.id,
      thu_tu: nextOrder,
      trang_thai: true,
      mau_sac: targetGroup?.mau_sac || 'blue',
      ap_dung_tat_ca: true,
      loai_ho_so_ids: [],
      cau_hinh_truong: [],
    });
    setTypeModalOpen(true);
  };

  const handleOpenEditType = (record: LoaiTaiLieu, parentGroupId?: number) => {
    setTypeMode('edit');
    setEditingType(record);
    setTypeCodeEdited(true);
    typeForm.resetFields();
    typeForm.setFieldsValue({
      nhom_tai_lieu_id: record.nhom_tai_lieu_id ?? parentGroupId,
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
    setTypeModalOpen(true);
  };

  const handleSaveType = async (values: LoaiTaiLieuFormValues) => {
    const cleanedFields = cleanCustomFieldsPayload(values.cau_hinh_truong);
    const apDungTatCa = values.ap_dung_tat_ca !== false;

    const basePayload = {
      nhom_tai_lieu_id: values.nhom_tai_lieu_id,
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
      if (typeMode === 'create') {
        await createLoai({
          ma_loai_tai_lieu: values.ma_loai_tai_lieu?.trim().toUpperCase(),
          ...basePayload,
        });
        message.success('Thêm mới loại tài liệu thành công!');
      } else if (editingType) {
        const canChangeCode = !editingType.is_system && (editingType.so_luong_tai_lieu ?? 0) === 0;
        await updateLoai({
          id: editingType.id,
          data: canChangeCode
            ? { ma_loai_tai_lieu: values.ma_loai_tai_lieu?.trim().toUpperCase(), ...basePayload }
            : basePayload,
        });
        message.success('Cập nhật loại tài liệu thành công!');
      }
      setTypeModalOpen(false);
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, 'Lỗi khi lưu loại tài liệu'));
    }
  };

  const handleDeleteType = async (record: LoaiTaiLieu) => {
    try {
      await deleteLoai(record.id);
      message.success(`Đã xóa loại tài liệu "${record.ten_loai_tai_lieu}"`);
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, 'Không thể xóa loại tài liệu'));
    }
  };

  const buildTypeColumns = (parentGroupId: number) => [
    {
      title: 'STT',
      dataIndex: 'thu_tu',
      key: 'thu_tu',
      width: 60,
      align: 'center' as const,
      render: (val: number) => <span className="font-semibold text-gray-500">{val}</span>,
    },
    {
      title: 'Loại tài liệu (Trường tải lên)',
      dataIndex: 'ten_loai_tai_lieu',
      key: 'ten_loai_tai_lieu',
      render: (text: string, record: LoaiTaiLieu) => (
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Tag
              color={getLoaiHoSoAntdColor(record.ma_loai_tai_lieu, record.mau_sac)}
              className="font-semibold m-0 px-2 py-0.5 text-xs"
            >
              {text}
            </Tag>
            <code className="text-[11px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
              {record.ma_loai_tai_lieu}
            </code>
            {record.is_system && (
              <Tag color="blue" className="text-[11px] m-0">
                Mặc định
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
      title: 'Phạm vi Loại hồ sơ',
      key: 'pham_vi',
      width: 210,
      render: (record: LoaiTaiLieu) => {
        if (record.ap_dung_tat_ca !== false) {
          return (
            <Tag color="cyan" className="m-0 text-[11px]">
              Theo phạm vi nhóm
            </Tag>
          );
        }
        const applied = record.loai_ho_so_list || [];
        return applied.length === 0 ? (
          <Text type="secondary" className="text-xs italic">
            Chưa gán
          </Text>
        ) : (
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
      title: 'Trường bổ sung',
      key: 'truong_dong',
      width: 130,
      render: (record: LoaiTaiLieu) => {
        const count = Array.isArray(record.cau_hinh_truong) ? record.cau_hinh_truong.length : 0;
        return count > 0 ? (
          <Tag color="geekblue" className="text-[11px] m-0">
            {count} trường phụ
          </Tag>
        ) : (
          <span className="text-xs text-gray-400">Chuẩn</span>
        );
      },
    },
    {
      title: 'Tệp',
      dataIndex: 'so_luong_tai_lieu',
      key: 'so_luong_tai_lieu',
      width: 75,
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
      width: 115,
      align: 'center' as const,
      render: (val: boolean) =>
        val !== false ? (
          <Tag color="success" className="m-0 text-[11px]">
            Hoạt động
          </Tag>
        ) : (
          <Tag color="default" className="m-0 text-[11px]">
            Ngưng
          </Tag>
        ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 135,
      align: 'center' as const,
      render: (record: LoaiTaiLieu) => {
        const canDelete = !record.is_system && (record.so_luong_tai_lieu ?? 0) === 0;
        const deleteTooltip = record.is_system
          ? 'Loại mặc định hệ thống không thể xóa'
          : (record.so_luong_tai_lieu ?? 0) > 0
            ? `Đang có ${record.so_luong_tai_lieu} tài liệu sử dụng`
            : 'Xóa loại tài liệu';

        return (
          <Space size="small">
            {canDanhMucUpdate && (
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleOpenEditType(record, parentGroupId)}
              >
                Sửa
              </Button>
            )}
            {canDanhMucDelete &&
              (canDelete ? (
                <Popconfirm
                  title={`Xóa "${record.ten_loai_tai_lieu}"?`}
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true, loading: deletingLoai }}
                  onConfirm={() => handleDeleteType(record)}
                >
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              ) : (
                <Tooltip title={deleteTooltip}>
                  <Button size="small" danger icon={<DeleteOutlined />} disabled />
                </Tooltip>
              ))}
          </Space>
        );
      },
    },
  ];

  const renderScopeTags = (group: NhomTaiLieu) => {
    if (group.ap_dung_tat_ca !== false) {
      return (
        <Tag color="cyan" className="m-0 text-[11px]">
          Tất cả loại hồ sơ
        </Tag>
      );
    }
    const applied = group.loai_ho_so_list || [];
    if (applied.length === 0) {
      return <Tag className="m-0 text-[11px]">Chưa chọn loại hồ sơ</Tag>;
    }
    return applied.map((lhs) => (
      <Tag
        key={lhs.id}
        color={getLoaiHoSoAntdColor(lhs.ma_loai, lhs.mau_sac)}
        className="m-0 text-[11px]"
      >
        {lhs.ten_loai}
      </Tag>
    ));
  };

  return (
    <div className="space-y-4">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card className="shadow-sm border-gray-100 rounded-xl h-full">
            <Statistic
              title={<Text className="text-gray-500 font-medium">Nhóm tài liệu (Cấp 1)</Text>}
              value={groups.length}
              suffix={<span className="text-xs text-gray-400">({activeGroupsCount} hoạt động)</span>}
              prefix={<FolderOpenOutlined className="text-blue-500 mr-1" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="shadow-sm border-gray-100 rounded-xl h-full">
            <Statistic
              title={<Text className="text-gray-500 font-medium">Loại tài liệu (Cấp 2)</Text>}
              value={totalTypesCount}
              prefix={<FileTextOutlined className="text-purple-500 mr-1" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Alert
            title="Cấu trúc 2 cấp & Phân quyền động"
            description="Tài liệu được gom theo Nhóm (vd: Tài liệu chung, Tài liệu đặc thù, Tài liệu sản xuất...). Mỗi Nhóm mới tự động sinh 4 quyền Xem/Tải lên/Thay thế/Xóa trong Phân quyền RBAC; bên trong mỗi Nhóm có nhiều Loại tài liệu riêng biệt."
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            className="rounded-xl h-full"
          />
        </Col>
      </Row>

      <Card
        className="shadow-sm border-gray-100 rounded-xl"
        title={
          <div className="flex items-center gap-2 py-1 flex-wrap">
            <FolderOpenOutlined className="text-blue-600 text-lg" />
            <Title level={5} className="!mb-0">
              Cấu hình Nhóm tài liệu &amp; Các loại tài liệu thành phần
            </Title>
          </div>
        }
        extra={
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading}>
              Làm mới
            </Button>
            {canDanhMucCreate && (
              <>
                <Button icon={<PlusOutlined />} onClick={() => handleOpenCreateType()}>
                  Thêm Loại tài liệu
                </Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateGroup}>
                  Thêm Nhóm tài liệu
                </Button>
              </>
            )}
          </Space>
        }
      >
        {groups.length === 0 && !isLoading ? (
          <Empty description="Chưa có nhóm tài liệu nào" className="my-8" />
        ) : (
          <div className="space-y-4">
            {groups.map((group) => {
              const groupTypes = group.loai_tai_lieu || [];
              const canDeleteGroup = !group.is_system && groupTypes.length === 0;
              const deleteGroupTip = group.is_system
                ? 'Nhóm mặc định hệ thống không thể xóa'
                : groupTypes.length > 0
                  ? `Nhóm đang chứa ${groupTypes.length} loại tài liệu, vui lòng chuyển hoặc xóa hết loại trước`
                  : 'Xóa nhóm tài liệu';

              return (
                <div
                  key={group.id}
                  className={`border rounded-xl overflow-hidden ${
                    group.trang_thai === false
                      ? 'border-gray-200 bg-gray-50/60 opacity-80'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="bg-slate-50/90 border-b border-slate-200 px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Tag
                          color={getLoaiHoSoAntdColor(group.ma_nhom, group.mau_sac)}
                          className="font-semibold m-0 px-2.5 py-0.5 text-sm"
                        >
                          {group.thu_tu}. {group.ten_nhom}
                        </Tag>
                        <code className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-700">
                          {group.ma_nhom}
                        </code>
                        {group.is_system && (
                          <Tag color="blue" className="m-0 text-[11px]">
                            Mặc định hệ thống
                          </Tag>
                        )}
                        {group.trang_thai === false && (
                          <Tag color="default" className="m-0 text-[11px]">
                            Ngưng hoạt động
                          </Tag>
                        )}
                        <Tooltip title="Mã quyền RBAC tự động tạo cho nhóm này">
                          <Tag icon={<SafetyCertificateOutlined />} color="purple" className="m-0 text-[11px]">
                            RBAC: HOSO_TAI_LIEU_GROUP:{group.ma_nhom}
                          </Tag>
                        </Tooltip>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-1.5 text-xs text-gray-500">
                        <span>Phạm vi:</span>
                        {renderScopeTags(group)}
                        {group.mo_ta && (
                          <span className="text-gray-400">• {group.mo_ta}</span>
                        )}
                      </div>
                    </div>

                    <Space size="small" wrap className="shrink-0">
                      {canDanhMucCreate && (
                        <Button
                          size="small"
                          type="primary"
                          ghost
                          icon={<PlusOutlined />}
                          onClick={() => handleOpenCreateType(group)}
                        >
                          Thêm loại vào nhóm
                        </Button>
                      )}
                      {canDanhMucUpdate && (
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => handleOpenEditGroup(group)}
                        >
                          Sửa nhóm
                        </Button>
                      )}
                      {canDanhMucDelete &&
                        (canDeleteGroup ? (
                          <Popconfirm
                            title={`Xóa nhóm "${group.ten_nhom}"?`}
                            description="Nhóm và mã quyền RBAC tương ứng sẽ bị xóa khỏi hệ thống."
                            okText="Xóa"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true, loading: deletingNhom }}
                            onConfirm={() => handleDeleteGroup(group)}
                          >
                            <Button size="small" danger icon={<DeleteOutlined />} />
                          </Popconfirm>
                        ) : (
                          <Tooltip title={deleteGroupTip}>
                            <Button size="small" danger icon={<DeleteOutlined />} disabled />
                          </Tooltip>
                        ))}
                    </Space>
                  </div>

                  <div className="p-3 bg-white">
                    {groupTypes.length === 0 ? (
                      <div className="py-4 text-center text-xs text-gray-400">
                        Chưa có loại tài liệu nào trong nhóm này. Bấm{' '}
                        <Button
                          type="link"
                          size="small"
                          className="!px-1 !text-xs"
                          onClick={() => handleOpenCreateType(group)}
                          disabled={!canDanhMucCreate}
                        >
                          + Thêm loại vào nhóm
                        </Button>
                        để thêm các trường tài liệu (vd: Quy trình, Tiêu chuẩn...).
                      </div>
                    ) : (
                      <Table
                        columns={buildTypeColumns(group.id)}
                        dataSource={groupTypes}
                        rowKey="id"
                        size="small"
                        pagination={false}
                        scroll={{ x: 'max-content' }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* MODAL NHÓM TÀI LIỆU */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <FolderOpenOutlined className="text-blue-600" />
            <span>
              {groupMode === 'create'
                ? 'Thêm mới Nhóm tài liệu (tự động cập nhật RBAC)'
                : `Chỉnh sửa Nhóm: ${editingGroup?.ten_nhom}`}
            </span>
          </div>
        }
        open={groupModalOpen}
        onCancel={() => setGroupModalOpen(false)}
        footer={null}
        width="min(640px, 95vw)"
        destroyOnHidden
      >
        <Form
          form={groupForm}
          layout="vertical"
          onFinish={handleSaveGroup}
          className="mt-4"
        >
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="ten_nhom"
                label="Tên nhóm tài liệu"
                rules={[{ required: true, message: 'Vui lòng nhập tên nhóm tài liệu' }]}
              >
                <Input
                  placeholder="VD: Tài liệu sản xuất"
                  onChange={(e) => {
                    if (groupMode === 'create' && !groupCodeEdited) {
                      groupForm.setFieldValue('ma_nhom', toMaLoaiCode(e.target.value));
                    }
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="ma_nhom"
                label={
                  <span className="flex items-center gap-1">
                    Mã nhóm (RBAC Key)
                    {groupMode === 'edit' && editingGroup?.is_system && (
                      <Tooltip title="Nhóm mặc định hệ thống được khóa mã để đảm bảo đồng bộ">
                        <LockOutlined className="text-gray-400" />
                      </Tooltip>
                    )}
                  </span>
                }
                rules={[
                  { required: true, message: 'Vui lòng nhập mã nhóm' },
                  {
                    pattern: /^[A-Za-z0-9_]+$/,
                    message: 'Mã chỉ gồm chữ không dấu, số và dấu gạch dưới (_)',
                  },
                ]}
              >
                <Input
                  placeholder="VD: TAI_LIEU_SAN_XUAT"
                  disabled={groupMode === 'edit' && Boolean(editingGroup?.is_system)}
                  onChange={(e) => {
                    setGroupCodeEdited(true);
                    groupForm.setFieldValue('ma_nhom', toMaLoaiCode(e.target.value));
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} sm={10}>
              <Form.Item name="mau_sac" label="Màu hiển thị">
                <Select options={LOAI_HO_SO_COLORS} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={7}>
              <Form.Item name="thu_tu" label="Thứ tự">
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>
            <Col xs={12} sm={7}>
              <Form.Item name="trang_thai" label="Hoạt động" valuePropName="checked">
                <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
              </Form.Item>
            </Col>
          </Row>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
            <Form.Item
              name="ap_dung_tat_ca"
              label="Phạm vi áp dụng cho Loại hồ sơ"
              valuePropName="checked"
              className="!mb-2"
            >
              <Switch
                checkedChildren="Áp dụng cho TẤT CẢ loại hồ sơ"
                unCheckedChildren="Chỉ áp dụng cho các loại hồ sơ đã chọn"
              />
            </Form.Item>

            {apDungTatCaFalse(groupApDungTatCa) && (
              <Form.Item
                name="loai_ho_so_ids"
                label="Chọn loại hồ sơ được phép dùng nhóm này"
                rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 loại hồ sơ' }]}
                className="!mb-0"
              >
                <Select
                  mode="multiple"
                  placeholder="Chọn một hoặc nhiều loại hồ sơ..."
                  options={loaiHoSoList.map((lhs) => ({
                    value: lhs.id,
                    label: `${lhs.ten_loai} (${lhs.ma_loai})`,
                  }))}
                />
              </Form.Item>
            )}
          </div>

          <Form.Item name="mo_ta" label="Mô tả">
            <Input.TextArea rows={2} placeholder="Mô tả mục đích hoặc ghi chú cho nhóm tài liệu..." />
          </Form.Item>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button onClick={() => setGroupModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={creatingNhom || updatingNhom}>
              {groupMode === 'create' ? 'Tạo nhóm tài liệu' : 'Lưu thay đổi'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* MODAL LOẠI TÀI LIỆU (CẤP 2) */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <FileTextOutlined className="text-purple-600" />
            <span>
              {typeMode === 'create'
                ? 'Thêm mới Loại tài liệu vào nhóm'
                : `Chỉnh sửa Loại tài liệu: ${editingType?.ten_loai_tai_lieu}`}
            </span>
          </div>
        }
        open={typeModalOpen}
        onCancel={() => setTypeModalOpen(false)}
        footer={null}
        width="min(780px, 95vw)"
        destroyOnHidden
      >
        <Form
          form={typeForm}
          layout="vertical"
          onFinish={handleSaveType}
          className="mt-4"
        >
          <Form.Item
            name="nhom_tai_lieu_id"
            label="Thuộc Nhóm tài liệu"
            rules={[{ required: true, message: 'Vui lòng chọn nhóm tài liệu' }]}
          >
            <Select
              placeholder="Chọn nhóm tài liệu (vd: Tài liệu chung, Tài liệu sản xuất...)"
              options={groups.map((g) => ({
                value: g.id,
                label: `${g.ten_nhom} (${g.ma_nhom})`,
              }))}
            />
          </Form.Item>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="ten_loai_tai_lieu"
                label="Tên loại tài liệu (Trường tải lên)"
                rules={[{ required: true, message: 'Vui lòng nhập tên loại tài liệu' }]}
              >
                <Input
                  placeholder="VD: Quy trình sản xuất, Tiêu chuẩn cơ sở..."
                  onChange={(e) => {
                    if (typeMode === 'create' && !typeCodeEdited) {
                      typeForm.setFieldValue('ma_loai_tai_lieu', toMaLoaiCode(e.target.value));
                    }
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="ma_loai_tai_lieu"
                label={
                  <span className="flex items-center gap-1">
                    Mã loại tài liệu
                    {typeMode === 'edit' &&
                      (editingType?.is_system || (editingType?.so_luong_tai_lieu ?? 0) > 0) && (
                        <Tooltip title="Mã được khóa khi là loại mặc định hoặc đã có tài liệu phát sinh">
                          <LockOutlined className="text-gray-400" />
                        </Tooltip>
                      )}
                  </span>
                }
                rules={[
                  { required: true, message: 'Vui lòng nhập mã loại tài liệu' },
                  {
                    pattern: /^[A-Za-z0-9_]+$/,
                    message: 'Mã chỉ gồm chữ không dấu, số và dấu gạch dưới (_)',
                  },
                ]}
              >
                <Input
                  placeholder="VD: QUY_TRINH_SAN_XUAT"
                  disabled={
                    typeMode === 'edit' &&
                    (Boolean(editingType?.is_system) || (editingType?.so_luong_tai_lieu ?? 0) > 0)
                  }
                  onChange={(e) => {
                    setTypeCodeEdited(true);
                    typeForm.setFieldValue('ma_loai_tai_lieu', toMaLoaiCode(e.target.value));
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} sm={10}>
              <Form.Item name="mau_sac" label="Màu hiển thị">
                <Select options={LOAI_HO_SO_COLORS} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={7}>
              <Form.Item name="thu_tu" label="Thứ tự">
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>
            <Col xs={12} sm={7}>
              <Form.Item name="trang_thai" label="Hoạt động" valuePropName="checked">
                <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
              </Form.Item>
            </Col>
          </Row>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
            <Form.Item
              name="ap_dung_tat_ca"
              label="Giới hạn thêm theo Loại hồ sơ (tùy chọn)"
              valuePropName="checked"
              className="!mb-2"
            >
              <Switch
                checkedChildren="Theo phạm vi của Nhóm (mặc định)"
                unCheckedChildren="Chỉ hiện cho một số Loại hồ sơ riêng"
              />
            </Form.Item>

            {apDungTatCaFalse(typeApDungTatCa) && (
              <Form.Item
                name="loai_ho_so_ids"
                label="Chọn loại hồ sơ cụ thể"
                rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 loại hồ sơ' }]}
                className="!mb-0"
              >
                <Select
                  mode="multiple"
                  placeholder="Chọn loại hồ sơ..."
                  options={loaiHoSoList.map((lhs) => ({
                    value: lhs.id,
                    label: `${lhs.ten_loai} (${lhs.ma_loai})`,
                  }))}
                />
              </Form.Item>
            )}
          </div>

          <Form.Item name="mo_ta" label="Mô tả">
            <Input.TextArea rows={2} placeholder="Mô tả tài liệu cần tải lên ở mục này..." />
          </Form.Item>

          <Collapse
            ghost
            className="mb-4 border border-dashed border-gray-200 rounded-lg"
            items={[
              {
                key: 'custom-fields',
                label: (
                  <span className="text-xs font-medium text-gray-600">
                    Cấu hình trường thông tin bổ sung (tùy chọn khi tải loại tài liệu này)
                  </span>
                ),
                children: (
                  <CustomFieldsBuilder
                    form={typeForm}
                    crudMode={typeMode}
                    existingFields={editingType?.cau_hinh_truong}
                    dividerTitle="Trường thông tin bổ sung (hiển thị khi upload loại tài liệu này)"
                    emptyText="Chưa có trường bổ sung nào. Thêm nếu loại tài liệu này cần nhập thêm Số công văn, Cơ quan cấp..."
                    addButtonText="Thêm trường thông tin"
                  />
                ),
              },
            ]}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button onClick={() => setTypeModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={creatingLoai || updatingLoai}>
              {typeMode === 'create' ? 'Tạo loại tài liệu' : 'Lưu thay đổi'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

function apDungTatCaFalse(val: boolean | undefined) {
  return val === false;
}
