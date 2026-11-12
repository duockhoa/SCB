'use client';

import {
  Table,
  Button,
  Space,
  Tag,
  Empty,
  Upload,
  message,
  Modal,
  Form,
  Input,
  Popconfirm,
  Select,
  DatePicker,
  Row,
  Col,
  Divider,
} from 'antd';
import {
  EyeOutlined,
  FolderOpenOutlined,
  UploadOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  CalendarOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { useMemo, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import type { CustomFieldConfig, HoSoChung, LoaiTaiLieu, TaiLieuHoSo } from '@/types/ho-so.type';
import { uploadFile, axiosInstance } from '@/services/api';
import { openDocumentUrl } from '@/utils/file-viewer';
import {
  useUpdateHoSo,
  useAddTaiLieu,
  useUpdateTaiLieu,
  useReplaceTaiLieu,
  useDeleteTaiLieu,
} from '@/hooks/queries/useHoSo';
import { useLoaiTaiLieuList } from '@/hooks/queries/useDanhMuc';
import { useQueryClient } from '@tanstack/react-query';
import UploadOrLinkInput from '../common/UploadOrLinkInput';
import { usePermissions } from '@/hooks/usePermissions';
import {
  getCustomFields,
  getFieldLabel,
  getLoaiHoSoAntdColor,
  isFileFieldKey,
} from '@/utils/loai-ho-so';
import DynamicFieldsForm from './forms/DynamicFieldsForm';

interface Props {
  hoSo: HoSoChung;
  thongTinRieng: Record<string, unknown> | null;
}

interface TaiLieuRow {
  id: string | number;
  real_id?: number;
  ten_tai_lieu: string;
  nhom_tai_lieu: string;
  loai_tai_lieu_id?: number;
  loai_tai_lieu?: LoaiTaiLieu | null;
  url: string;
  raw_url?: string;
  field_key?: string;
  is_dynamic: boolean;
  ghi_chu?: string | null;
  so_phien_ban?: number;
  tai_lieu_hien_hanh?: boolean;
  ngay_tai_len?: string;
  ngay_hieu_luc?: string | null;
  ngay_het_hieu_luc?: string | null;
  du_lieu_dac_thu?: Record<string, unknown> | null;
}

interface DocModalFormValues {
  loai_tai_lieu_id?: number;
  ten_tai_lieu: string;
  ngay_hieu_luc?: Dayjs | null;
  ngay_het_hieu_luc?: Dayjs | null;
  ghi_chu?: string;
  duong_dan_url: string;
  du_lieu_dac_thu?: Record<string, unknown>;
}

function getFullUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${cleanBase}${cleanUrl}`;
}

function isLinkValue(val: unknown, field?: CustomFieldConfig): boolean {
  if (typeof val !== 'string' || !val) return false;
  return (
    field?.type === 'file' ||
    val.startsWith('http://') ||
    val.startsWith('https://') ||
    val.startsWith('/uploads/')
  );
}

function formatDateDisplay(val: unknown): string {
  if (!val) return '';
  const d = dayjs(val as string | number | Date);
  return d.isValid() ? d.format('DD/MM/YYYY') : String(val);
}

function serializeDynamicDocValues(
  raw: Record<string, unknown> | undefined,
  fields: CustomFieldConfig[],
): Record<string, unknown> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const dateKeys = new Set(fields.filter((f) => f.type === 'date').map((f) => f.key));
  const result: Record<string, unknown> = {};

  for (const [k, v] of Object.entries(raw)) {
    if (v === undefined || v === null || v === '') continue;
    if (dateKeys.has(k) && dayjs.isDayjs(v)) {
      result[k] = v.format('YYYY-MM-DD');
    } else {
      result[k] = v;
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function hydrateDynamicDocValues(
  raw: Record<string, unknown> | null | undefined,
  fields: CustomFieldConfig[],
): Record<string, unknown> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const dateKeys = new Set(fields.filter((f) => f.type === 'date').map((f) => f.key));
  const result: Record<string, unknown> = { ...raw };

  for (const key of dateKeys) {
    const val = result[key];
    if (val) {
      const parsed = dayjs(val as string | number | Date);
      if (parsed.isValid()) result[key] = parsed;
    }
  }
  return result;
}

export default function HoSoTaiLieuTab({ hoSo, thongTinRieng }: Props) {
  const { mutate: updateHoSo } = useUpdateHoSo();
  const { mutateAsync: addTaiLieu, isPending: addingTaiLieu } = useAddTaiLieu();
  const { mutateAsync: updateTaiLieu, isPending: updatingTaiLieu } = useUpdateTaiLieu();
  const { mutateAsync: replaceTaiLieu, isPending: replacingTaiLieu } = useReplaceTaiLieu();
  const { mutate: deleteTaiLieu } = useDeleteTaiLieu();
  const { canTaiLieuUpload, canTaiLieuReplace, canTaiLieuDelete } = usePermissions();

  const { data: loaiTaiLieuRes } = useLoaiTaiLieuList({ loaiHoSoId: hoSo.loai_ho_so_id });
  const activeLoaiTaiLieuList: LoaiTaiLieu[] = useMemo(
    () => loaiTaiLieuRes?.data || [],
    [loaiTaiLieuRes?.data],
  );

  const queryClient = useQueryClient();
  const [uploadingId, setUploadingId] = useState<string | number | null>(null);
  const [viewingRecordId, setViewingRecordId] = useState<string | number | null>(null);
  const [filterLoaiId, setFilterLoaiId] = useState<string | number | undefined>(undefined);

  const [docModalMode, setDocModalMode] = useState<'create' | 'edit' | 'replace' | null>(null);
  const [activeDocRecord, setActiveDocRecord] = useState<TaiLieuRow | null>(null);
  const [form] = Form.useForm<DocModalFormValues>();
  const watchedLoaiTaiLieuId = Form.useWatch('loai_tai_lieu_id', form);

  const modalLoaiTaiLieuOptions = useMemo(() => {
    if (
      activeDocRecord?.loai_tai_lieu &&
      !activeLoaiTaiLieuList.some((item) => item.id === activeDocRecord.loai_tai_lieu?.id)
    ) {
      return [...activeLoaiTaiLieuList, activeDocRecord.loai_tai_lieu];
    }
    return activeLoaiTaiLieuList;
  }, [activeLoaiTaiLieuList, activeDocRecord]);

  const selectedLoaiTaiLieu = useMemo(
    () => modalLoaiTaiLieuOptions.find((item) => item.id === watchedLoaiTaiLieuId) || null,
    [modalLoaiTaiLieuOptions, watchedLoaiTaiLieuId],
  );

  const selectedCustomFields = useMemo(
    () => getCustomFields(selectedLoaiTaiLieu),
    [selectedLoaiTaiLieu],
  );

  const dataSource: TaiLieuRow[] = useMemo(() => {
    const rows: TaiLieuRow[] = [];
    let idCounter = 1;

    if (hoSo.ho_so_luu_url) {
      rows.push({
        id: `chung-${idCounter++}`,
        ten_tai_lieu: 'Thư mục Hồ sơ lưu trữ',
        nhom_tai_lieu: 'Tài liệu chung',
        url: getFullUrl(hoSo.ho_so_luu_url),
        raw_url: hoSo.ho_so_luu_url,
        field_key: 'ho_so_luu_url',
        is_dynamic: false,
      });
    }

    if (thongTinRieng) {
      Object.keys(thongTinRieng).forEach((key) => {
        const val = thongTinRieng[key];
        if (
          key !== 'id' &&
          key !== 'ho_so_chung_id' &&
          isFileFieldKey(key, hoSo.loai_ho_so) &&
          typeof val === 'string' &&
          val
        ) {
          rows.push({
            id: `dacthu-${idCounter++}`,
            ten_tai_lieu: getFieldLabel(key, hoSo.loai_ho_so),
            nhom_tai_lieu: 'Tài liệu đặc thù',
            url: getFullUrl(val),
            raw_url: val,
            field_key: key,
            is_dynamic: false,
          });
        }
      });
    }

    if (hoSo.tai_lieu && hoSo.tai_lieu.length > 0) {
      hoSo.tai_lieu.forEach((tl: TaiLieuHoSo) => {
        rows.push({
          id: tl.id,
          real_id: tl.id,
          ten_tai_lieu: tl.ten_tai_lieu,
          nhom_tai_lieu: tl.loai_tai_lieu?.ten_loai_tai_lieu || 'Tài liệu khác',
          loai_tai_lieu_id: tl.loai_tai_lieu_id,
          loai_tai_lieu: tl.loai_tai_lieu || null,
          url: getFullUrl(tl.duong_dan_url),
          raw_url: tl.duong_dan_url,
          is_dynamic: true,
          ghi_chu: tl.ghi_chu,
          so_phien_ban: tl.so_phien_ban || 1,
          tai_lieu_hien_hanh: tl.tai_lieu_hien_hanh !== false,
          ngay_tai_len: tl.ngay_tai_len,
          ngay_hieu_luc: tl.ngay_hieu_luc,
          ngay_het_hieu_luc: tl.ngay_het_hieu_luc,
          du_lieu_dac_thu: tl.du_lieu_dac_thu || null,
        });
      });
    }

    return rows;
  }, [hoSo, thongTinRieng]);

  const filterOptions = useMemo(() => {
    const opts: Array<{ value: string | number; label: string }> = [];
    const seen = new Set<string | number>();

    dataSource.forEach((row) => {
      if (!row.is_dynamic) {
        const key = `builtin:${row.nhom_tai_lieu}`;
        if (!seen.has(key)) {
          seen.add(key);
          opts.push({ value: key, label: row.nhom_tai_lieu });
        }
      } else if (row.loai_tai_lieu_id) {
        if (!seen.has(row.loai_tai_lieu_id)) {
          seen.add(row.loai_tai_lieu_id);
          opts.push({ value: row.loai_tai_lieu_id, label: row.nhom_tai_lieu });
        }
      }
    });

    return opts;
  }, [dataSource]);

  const filteredDataSource = useMemo(() => {
    if (!filterLoaiId) return dataSource;
    return dataSource.filter((row) => {
      if (typeof filterLoaiId === 'string' && filterLoaiId.startsWith('builtin:')) {
        return !row.is_dynamic && `builtin:${row.nhom_tai_lieu}` === filterLoaiId;
      }
      return row.is_dynamic && row.loai_tai_lieu_id === filterLoaiId;
    });
  }, [dataSource, filterLoaiId]);

  const handleOpenCreateModal = () => {
    setActiveDocRecord(null);
    setDocModalMode('create');
    form.resetFields();
    const defaultLoai =
      activeLoaiTaiLieuList.find((item) => item.ma_loai_tai_lieu === 'KHAC') ||
      activeLoaiTaiLieuList[0];
    form.setFieldsValue({
      loai_tai_lieu_id: defaultLoai?.id,
    });
  };

  const handleOpenEditModal = (record: TaiLieuRow) => {
    setActiveDocRecord(record);
    setDocModalMode('edit');
    const fields = getCustomFields(record.loai_tai_lieu);
    form.resetFields();
    form.setFieldsValue({
      loai_tai_lieu_id: record.loai_tai_lieu_id,
      ten_tai_lieu: record.ten_tai_lieu,
      ngay_hieu_luc: record.ngay_hieu_luc ? dayjs(record.ngay_hieu_luc) : null,
      ngay_het_hieu_luc: record.ngay_het_hieu_luc ? dayjs(record.ngay_het_hieu_luc) : null,
      ghi_chu: record.ghi_chu || '',
      duong_dan_url: record.raw_url || '',
      du_lieu_dac_thu: hydrateDynamicDocValues(record.du_lieu_dac_thu, fields),
    });
  };

  const handleOpenReplaceModal = (record: TaiLieuRow) => {
    setActiveDocRecord(record);
    setDocModalMode('replace');
    const fields = getCustomFields(record.loai_tai_lieu);
    form.resetFields();
    form.setFieldsValue({
      loai_tai_lieu_id: record.loai_tai_lieu_id,
      ten_tai_lieu: record.ten_tai_lieu,
      ngay_hieu_luc: dayjs(),
      ngay_het_hieu_luc: record.ngay_het_hieu_luc ? dayjs(record.ngay_het_hieu_luc) : null,
      ghi_chu: `Bản thay thế cho phiên bản v${record.so_phien_ban || 1}`,
      duong_dan_url: '',
      du_lieu_dac_thu: hydrateDynamicDocValues(record.du_lieu_dac_thu, fields),
    });
  };

  const handleCloseModal = () => {
    setDocModalMode(null);
    setActiveDocRecord(null);
    form.resetFields();
  };

  const handleSubmitDocModal = async (values: DocModalFormValues) => {
    if (!values.duong_dan_url) {
      message.error('Vui lòng cung cấp link hoặc file đính kèm');
      return;
    }

    const customPayload = serializeDynamicDocValues(values.du_lieu_dac_thu, selectedCustomFields);
    const ngayHieuLuc = values.ngay_hieu_luc ? values.ngay_hieu_luc.format('YYYY-MM-DD') : undefined;
    const ngayHetHieuLuc = values.ngay_het_hieu_luc ? values.ngay_het_hieu_luc.format('YYYY-MM-DD') : undefined;

    try {
      if (docModalMode === 'create') {
        await addTaiLieu({
          id: hoSo.id,
          data: {
            loai_tai_lieu_id: values.loai_tai_lieu_id,
            ten_tai_lieu: values.ten_tai_lieu,
            duong_dan_url: values.duong_dan_url,
            ngay_hieu_luc: ngayHieuLuc,
            ngay_het_hieu_luc: ngayHetHieuLuc,
            ghi_chu: values.ghi_chu,
            du_lieu_dac_thu: customPayload,
          },
        });
        message.success('Tải thêm tài liệu thành công!');
      } else if (docModalMode === 'edit' && activeDocRecord?.real_id) {
        await updateTaiLieu({
          id: hoSo.id,
          taiLieuId: activeDocRecord.real_id,
          data: {
            loai_tai_lieu_id: values.loai_tai_lieu_id,
            ten_tai_lieu: values.ten_tai_lieu,
            duong_dan_url: values.duong_dan_url,
            ngay_hieu_luc: ngayHieuLuc ?? null,
            ngay_het_hieu_luc: ngayHetHieuLuc ?? null,
            ghi_chu: values.ghi_chu?.trim() || null,
            du_lieu_dac_thu: customPayload ?? null,
          },
        });
        message.success('Cập nhật thông tin tài liệu thành công!');
      } else if (docModalMode === 'replace' && activeDocRecord?.real_id) {
        await replaceTaiLieu({
          id: hoSo.id,
          taiLieuId: activeDocRecord.real_id,
          data: {
            loai_tai_lieu_id: values.loai_tai_lieu_id,
            ten_tai_lieu: values.ten_tai_lieu,
            duong_dan_url: values.duong_dan_url,
            ngay_hieu_luc: ngayHieuLuc ?? null,
            ngay_het_hieu_luc: ngayHetHieuLuc ?? null,
            ghi_chu: values.ghi_chu?.trim() || null,
            du_lieu_dac_thu: customPayload ?? null,
          },
        });
        message.success(
          `Đã thay thế tài liệu thành công (Tạo phiên bản v${(activeDocRecord.so_phien_ban || 1) + 1})!`,
        );
      }
      handleCloseModal();
    } catch (error: unknown) {
      const apiMsg = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      message.error(Array.isArray(apiMsg) ? apiMsg.join(', ') : apiMsg || 'Lỗi khi lưu tài liệu');
    }
  };

  const handleUploadReplaceBuiltIn = async (file: File, record: TaiLieuRow) => {
    if (!record.field_key) return false;
    setUploadingId(record.id);
    try {
      const response = await uploadFile(file);
      if (response && response.url) {
        const updateData: Record<string, unknown> =
          record.nhom_tai_lieu === 'Tài liệu chung'
            ? { [record.field_key]: response.url }
            : {
                thong_tin_rieng: {
                  ...(thongTinRieng || {}),
                  [record.field_key]: response.url,
                },
              };

        updateHoSo(
          { id: hoSo.id, data: updateData },
          {
            onSuccess: () => {
              message.success('Tải và thay thế file thành công!');
              queryClient.invalidateQueries({ queryKey: ['HOSO_DETAIL'] });
            },
            onError: () => {
              message.error('Lỗi khi cập nhật hồ sơ');
            },
          },
        );
      }
    } catch {
      message.error('Lỗi khi tải file lên thay thế');
    } finally {
      setUploadingId(null);
    }
    return false;
  };

  const handleDeleteDocument = (record: TaiLieuRow) => {
    if (!record.real_id) return;
    deleteTaiLieu(
      { id: hoSo.id, taiLieuId: record.real_id },
      {
        onSuccess: () => message.success('Xóa tài liệu thành công'),
        onError: () => message.error('Lỗi khi xóa tài liệu'),
      },
    );
  };

  const handleViewFile = async (record: TaiLieuRow) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    if (record.url && record.url.startsWith('http') && !record.url.startsWith(apiUrl)) {
      window.open(record.url, '_blank');
      return;
    }

    setViewingRecordId(record.id);
    try {
      const response = await axiosInstance.get(record.url, {
        responseType: 'blob',
      });
      const fileUrl = window.URL.createObjectURL(response as unknown as Blob);
      window.open(fileUrl, '_blank');
    } catch {
      message.error('Lỗi khi mở tài liệu hoặc file không tồn tại');
    } finally {
      setViewingRecordId(null);
    }
  };

  const columns = [
    {
      title: 'Tên tài liệu & Chi tiết',
      dataIndex: 'ten_tai_lieu',
      key: 'ten_tai_lieu',
      render: (text: string, record: TaiLieuRow) => {
        const isExpired = record.is_dynamic && record.tai_lieu_hien_hanh === false;
        const customFields = getCustomFields(record.loai_tai_lieu);
        const customEntries = record.du_lieu_dac_thu
          ? Object.entries(record.du_lieu_dac_thu).filter(
              ([, v]) => v !== null && v !== undefined && v !== '',
            )
          : [];

        return (
          <Space direction="vertical" size={4} className="w-full">
            <div className="flex items-center gap-2 flex-wrap">
              <a
                onClick={() => handleViewFile(record)}
                className={`font-medium ${isExpired ? 'text-gray-400 line-through' : 'text-blue-600 hover:underline'}`}
              >
                {record.nhom_tai_lieu === 'Tài liệu chung' ? <FolderOpenOutlined className="mr-1" /> : null}
                {text}
              </a>
              {record.is_dynamic &&
                (record.tai_lieu_hien_hanh ? (
                  <Tag color="success" className="text-xs m-0">
                    Hiệu lực (v{record.so_phien_ban})
                  </Tag>
                ) : (
                  <Tag color="default" className="text-xs bg-gray-100 text-gray-500 border-gray-300 m-0">
                    Hết hiệu lực (v{record.so_phien_ban})
                  </Tag>
                ))}
            </div>

            {(record.ngay_hieu_luc || record.ngay_het_hieu_luc) && (
              <div className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                <CalendarOutlined className="text-gray-400" />
                {record.ngay_hieu_luc && (
                  <span>Hiệu lực: <strong>{formatDateDisplay(record.ngay_hieu_luc)}</strong></span>
                )}
                {record.ngay_het_hieu_luc && (
                  <span>Hết hạn: <strong className="text-orange-600">{formatDateDisplay(record.ngay_het_hieu_luc)}</strong></span>
                )}
              </div>
            )}

            {customEntries.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs bg-slate-50 border border-slate-200/80 rounded px-2.5 py-1.5">
                {customEntries.map(([key, val]) => {
                  const fieldCfg = customFields.find((f) => f.key === key);
                  const label = getFieldLabel(key, record.loai_tai_lieu);
                  return (
                    <span key={key} className="text-slate-600">
                      <span className="text-slate-400">{label}:</span>{' '}
                      {isLinkValue(val, fieldCfg) ? (
                        <a
                          onClick={() => openDocumentUrl(String(val))}
                          className="text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                          <LinkOutlined /> Xem tệp
                        </a>
                      ) : fieldCfg?.type === 'date' ? (
                        <strong className="text-slate-700">{formatDateDisplay(val)}</strong>
                      ) : (
                        <strong className="text-slate-700">{String(val)}</strong>
                      )}
                    </span>
                  );
                })}
              </div>
            )}

            {record.ghi_chu && (
              <span className="text-xs text-gray-400 italic">{record.ghi_chu}</span>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Loại tài liệu',
      dataIndex: 'nhom_tai_lieu',
      key: 'nhom_tai_lieu',
      width: 190,
      render: (text: string, record: TaiLieuRow) => {
        if (record.is_dynamic && record.loai_tai_lieu) {
          return (
            <Tag
              color={getLoaiHoSoAntdColor(
                record.loai_tai_lieu.ma_loai_tai_lieu,
                record.loai_tai_lieu.mau_sac,
              )}
              className="m-0"
            >
              {record.loai_tai_lieu.ten_loai_tai_lieu}
            </Tag>
          );
        }
        let color = 'purple';
        if (text === 'Tài liệu chung') color = 'blue';
        else if (text === 'Tài liệu đặc thù') color = 'green';
        return <Tag color={color} className="m-0">{text}</Tag>;
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 310,
      render: (_: unknown, record: TaiLieuRow) => {
        const isExpired = record.is_dynamic && record.tai_lieu_hien_hanh === false;

        return (
          <Space size="small" wrap>
            <Button
              type="primary"
              ghost
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewFile(record)}
              loading={viewingRecordId === record.id}
            >
              Mở xem
            </Button>
            {canTaiLieuUpload && record.is_dynamic && !isExpired && (
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleOpenEditModal(record)}
              >
                Sửa
              </Button>
            )}
            {canTaiLieuReplace && !isExpired && (
              record.is_dynamic ? (
                <Button
                  size="small"
                  icon={<UploadOutlined />}
                  onClick={() => handleOpenReplaceModal(record)}
                >
                  Thay thế
                </Button>
              ) : (
                <Upload
                  showUploadList={false}
                  beforeUpload={(file) => handleUploadReplaceBuiltIn(file, record)}
                >
                  <Button
                    size="small"
                    icon={<UploadOutlined />}
                    loading={uploadingId === record.id}
                  >
                    Upload thay thế
                  </Button>
                </Upload>
              )
            )}
            {canTaiLieuDelete && record.is_dynamic && (
              <Popconfirm
                title={isExpired ? 'Xóa bản lưu lịch sử này?' : 'Bạn có chắc chắn muốn xóa tài liệu này?'}
                onConfirm={() => handleDeleteDocument(record)}
              >
                <Button size="small" danger icon={<DeleteOutlined />}>
                  Xóa
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  const modalTitle =
    docModalMode === 'create'
      ? 'Thêm tài liệu đính kèm'
      : docModalMode === 'edit'
        ? `Chỉnh sửa tài liệu: ${activeDocRecord?.ten_tai_lieu}`
        : `Upload thay thế phiên bản v${activeDocRecord?.so_phien_ban || 1} → v${(activeDocRecord?.so_phien_ban || 1) + 1}`;

  return (
    <div>
      <div className="mb-4 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="m-0 font-semibold text-gray-800">Danh sách tài liệu đính kèm</h3>
          {filterOptions.length > 0 && (
            <Select
              allowClear
              placeholder="Lọc theo loại tài liệu"
              className="w-full sm:w-[220px]"
              size="small"
              value={filterLoaiId}
              onChange={(val) => setFilterLoaiId(val)}
              options={filterOptions}
            />
          )}
        </div>
        {canTaiLieuUpload && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateModal}>
            Thêm tài liệu
          </Button>
        )}
      </div>

      {filteredDataSource.length === 0 ? (
        <Empty description="Hồ sơ chưa có tài liệu đính kèm phù hợp" />
      ) : (
        <Table
          columns={columns}
          dataSource={filteredDataSource}
          rowKey="id"
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      )}

      <Modal
        title={modalTitle}
        open={docModalMode !== null}
        onCancel={handleCloseModal}
        onOk={() => form.submit()}
        confirmLoading={addingTaiLieu || updatingTaiLieu || replacingTaiLieu}
        okText={
          docModalMode === 'create'
            ? 'Tải lên'
            : docModalMode === 'edit'
              ? 'Lưu thay đổi'
              : 'Tạo phiên bản mới'
        }
        cancelText="Hủy"
        width={680}
        style={{ maxWidth: 'calc(100vw - 24px)' }}
        styles={{ body: { maxHeight: '72dvh', overflowY: 'auto', overflowX: 'hidden' } }}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitDocModal} className="mt-3">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="loai_tai_lieu_id"
                label="Loại tài liệu"
                rules={[{ required: true, message: 'Vui lòng chọn loại tài liệu' }]}
              >
                <Select
                  placeholder="Chọn loại tài liệu..."
                  optionFilterProp="label"
                  showSearch
                  onChange={() => {
                    form.setFieldValue('du_lieu_dac_thu', undefined);
                  }}
                >
                  {modalLoaiTaiLieuOptions.map((item) => (
                    <Select.Option
                      key={item.id}
                      value={item.id}
                      label={item.ten_loai_tai_lieu}
                    >
                      <Tag
                        color={getLoaiHoSoAntdColor(item.ma_loai_tai_lieu, item.mau_sac)}
                        className="m-0 mr-2"
                      >
                        {item.ten_loai_tai_lieu}
                      </Tag>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="ten_tai_lieu"
                label="Tên tài liệu"
                rules={[{ required: true, message: 'Vui lòng nhập tên tài liệu' }]}
              >
                <Input placeholder="VD: Công văn số 123/BYT..." />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="ngay_hieu_luc" label="Ngày hiệu lực">
                <DatePicker className="w-full" format="DD/MM/YYYY" placeholder="Chọn ngày hiệu lực" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="ngay_het_hieu_luc" label="Ngày hết hiệu lực">
                <DatePicker className="w-full" format="DD/MM/YYYY" placeholder="Chọn ngày hết hạn (nếu có)" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="duong_dan_url"
                label={docModalMode === 'replace' ? 'Link / File phiên bản mới' : 'Link / File đính kèm'}
                rules={[{ required: true, message: 'Vui lòng cung cấp link hoặc file' }]}
              >
                <UploadOrLinkInput placeholder="Dán link hoặc tải file lên..." />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item name="ghi_chu" label="Ghi chú">
                <Input.TextArea rows={2} placeholder="Nhập ghi chú thêm nếu có..." />
              </Form.Item>
            </Col>
          </Row>

          {selectedCustomFields.length > 0 && (
            <>
              <Divider plain style={{ margin: '8px 0 16px' }}>
                Thông tin riêng nhóm &quot;{selectedLoaiTaiLieu?.ten_loai_tai_lieu}&quot;
              </Divider>
              <DynamicFieldsForm
                fields={selectedCustomFields}
                fieldPrefix="du_lieu_dac_thu"
                fileDividerTitle="Tệp đính kèm bổ sung"
              />
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
}
