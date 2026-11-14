'use client';

import {
  Button,
  Space,
  Tag,
  Empty,
  Upload,
  Modal,
  Form,
  Input,
  Popconfirm,
  Select,
  DatePicker,
  Row,
  Col,
  Divider,
  Tabs,
  Badge,
  Typography,
  App,
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
  HistoryOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useMemo, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import type {
  CustomFieldConfig,
  HoSoChung,
  LoaiTaiLieu,
  NhomTaiLieu,
  TaiLieuHoSo,
} from '@/types/ho-so.type';
import { uploadFile, axiosInstance } from '@/services/api';
import {
  useUpdateHoSo,
  useAddTaiLieu,
  useUpdateTaiLieu,
  useReplaceTaiLieu,
  useDeleteTaiLieu,
} from '@/hooks/queries/useHoSo';
import { useNhomTaiLieuList } from '@/hooks/queries/useDanhMuc';
import { useQueryClient } from '@tanstack/react-query';
import UploadOrLinkInput from '../common/UploadOrLinkInput';
import { usePermissions } from '@/hooks/usePermissions';
import {
  getCustomFields,
  getFieldLabel,
  getLoaiHoSoAntdColor,
  isFileFieldKey,
  stripVietnameseAccents,
  toMaLoaiCode,
} from '@/utils/loai-ho-so';
import DynamicFieldsForm from './forms/DynamicFieldsForm';

const { Text } = Typography;

const BUILTIN_FIELD_TO_DOC_TYPE_ALIASES: Record<string, string[]> = {
  tieu_chuan_co_so_url: ['TCCS', 'TIEU_CHUAN_CO_SO'],
  cong_van_cap_url: ['CONG_VAN', 'CONG_VAN_CAP'],
  phieu_cong_bo_url: ['PHIEU_CONG_BO'],
  nhan_url: ['NHAN', 'NHAN_SAN_PHAM', 'MAU_NHAN'],
  nhan_san_pham_url: ['NHAN', 'NHAN_SAN_PHAM', 'MAU_NHAN'],
  hdsd_url: ['HDSD', 'HUONG_DAN_SU_DUNG'],
  huong_dan_su_dung_url: ['HDSD', 'HUONG_DAN_SU_DUNG'],
  quang_cao_url: ['QUANG_CAO', 'XN_QUANG_CAO', 'XAC_NHAN_QUANG_CAO'],
  xn_quang_cao_url: ['QUANG_CAO', 'XN_QUANG_CAO', 'XAC_NHAN_QUANG_CAO'],
  phieu_tiep_nhan_url: ['PHIEU_TIEP_NHAN'],
  tai_lieu_mo_ta_kt_url: ['TAI_LIEU_MO_TA_KT', 'TAI_LIEU_MO_TA_KY_THUAT'],
  quyet_dinh_cap_sdk_url: ['QUYET_DINH_CAP_SDK', 'QD_CAP_SDK'],
  ke_khai_gia_url: ['KE_KHAI_GIA'],
  ban_tu_cong_bo_url: ['BAN_TU_CONG_BO'],
  ho_so_luu_url: ['HO_SO_LUU', 'THU_MUC_HO_SO_LUU_TRU'],
  tai_lieu_quy_dinh_url: ['TAI_LIEU_QUY_DINH', 'VAN_BAN_QUY_DINH_TAM_THOI'],
};

interface Props {
  hoSo: HoSoChung;
  thongTinRieng: Record<string, unknown> | null;
}

interface BuiltInDocItem {
  id: string;
  ten_tai_lieu: string;
  field_key: string;
  is_chung: boolean;
  url: string;
  raw_url: string;
}

interface DynamicDocItem {
  id: number;
  real_id: number;
  ten_tai_lieu: string;
  loai_tai_lieu_id: number;
  loai_tai_lieu?: LoaiTaiLieu | null;
  ma_nhom: string;
  url: string;
  raw_url: string;
  ghi_chu?: string | null;
  so_phien_ban: number;
  tai_lieu_hien_hanh: boolean;
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
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanUrl = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (cleanBase.endsWith('/api') && cleanUrl.startsWith('/api/')) {
    return `${cleanBase.slice(0, -4)}${cleanUrl}`;
  }
  return `${cleanBase}${cleanUrl}`;
}

function isLinkValue(val: unknown, field?: CustomFieldConfig): boolean {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!trimmed) return false;
  return (
    field?.type === 'file' ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/uploads/') ||
    trimmed.startsWith('/upload/') ||
    trimmed.startsWith('/api/upload')
  );
}

function normalizeMatchText(value: string): string {
  return stripVietnameseAccents(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeComparableUrl(url: string): string {
  return getFullUrl(url).trim().replace(/\/+$/, '').toLowerCase();
}

function matchBuiltInFieldToDocType<T extends LoaiTaiLieu>(
  fieldKey: string,
  label: string,
  types: T[],
): T | undefined {
  if (types.length === 0) return undefined;

  const aliases = BUILTIN_FIELD_TO_DOC_TYPE_ALIASES[fieldKey] || [];
  const derivedCode = toMaLoaiCode(fieldKey.replace(/_url$/i, ''));
  const candidateCodes = [...aliases, ...(derivedCode ? [derivedCode] : [])];

  for (const code of candidateCodes) {
    const matched = types.find((lt) => lt.ma_loai_tai_lieu === code);
    if (matched) return matched;
  }

  const normalizedLabel = normalizeMatchText(label);
  if (normalizedLabel) {
    return types.find((lt) => normalizeMatchText(lt.ten_loai_tai_lieu) === normalizedLabel);
  }
  return undefined;
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
  const { message } = App.useApp();
  const { mutate: updateHoSo } = useUpdateHoSo();
  const { mutateAsync: addTaiLieu, isPending: addingTaiLieu } = useAddTaiLieu();
  const { mutateAsync: updateTaiLieu, isPending: updatingTaiLieu } = useUpdateTaiLieu();
  const { mutateAsync: replaceTaiLieu, isPending: replacingTaiLieu } = useReplaceTaiLieu();
  const { mutate: deleteTaiLieu } = useDeleteTaiLieu();
  const { canUpdate, hasTaiLieuGroupPermission } = usePermissions();

  const { data: nhomRes } = useNhomTaiLieuList({ loaiHoSoId: hoSo.loai_ho_so_id });
  const nhomList: NhomTaiLieu[] = useMemo(
    () => (Array.isArray(nhomRes?.data) ? nhomRes.data : []),
    [nhomRes?.data],
  );

  const queryClient = useQueryClient();
  const [uploadingId, setUploadingId] = useState<string | number | null>(null);
  const [viewingId, setViewingId] = useState<string | number | null>(null);
  const [activeGroupTab, setActiveGroupTab] = useState<string | undefined>(undefined);
  const [showHistoryMap, setShowHistoryMap] = useState<Record<number, boolean>>({});

  const [docModalMode, setDocModalMode] = useState<'create' | 'edit' | 'replace' | null>(null);
  const [activeDocRecord, setActiveDocRecord] = useState<DynamicDocItem | null>(null);
  const [form] = Form.useForm<DocModalFormValues>();
  const watchedLoaiTaiLieuId = Form.useWatch('loai_tai_lieu_id', form);

  // Tập các nhóm người dùng có quyền XEM
  const visibleGroups = useMemo(
    () => nhomList.filter((g) => hasTaiLieuGroupPermission(g.ma_nhom, 'VIEW')),
    [nhomList, hasTaiLieuGroupPermission],
  );

  // Danh sách phẳng tất cả loại tài liệu đang hoạt động thuộc các nhóm
  const allActiveTypes = useMemo(() => {
    const list: Array<LoaiTaiLieu & { parentNhomCode: string; parentNhomName: string }> = [];
    for (const g of nhomList) {
      for (const lt of g.loai_tai_lieu || []) {
        list.push({
          ...lt,
          parentNhomCode: g.ma_nhom,
          parentNhomName: g.ten_nhom,
        });
      }
    }
    return list;
  }, [nhomList]);

  const uploadableTypes = useMemo(
    () => allActiveTypes.filter((t) => hasTaiLieuGroupPermission(t.parentNhomCode, 'UPLOAD')),
    [allActiveTypes, hasTaiLieuGroupPermission],
  );

  const modalLoaiTaiLieuOptions = useMemo(() => {
    const allowedList = allActiveTypes.filter((item) => {
      if (docModalMode === 'replace') {
        return hasTaiLieuGroupPermission(item.parentNhomCode, 'REPLACE');
      }
      if (docModalMode === 'edit') {
        return (
          hasTaiLieuGroupPermission(item.parentNhomCode, 'UPLOAD') ||
          hasTaiLieuGroupPermission(item.parentNhomCode, 'REPLACE')
        );
      }
      return hasTaiLieuGroupPermission(item.parentNhomCode, 'UPLOAD');
    });

    if (
      activeDocRecord?.loai_tai_lieu &&
      !allowedList.some((item) => item.id === activeDocRecord.loai_tai_lieu?.id)
    ) {
      return [
        ...allowedList,
        {
          ...activeDocRecord.loai_tai_lieu,
          parentNhomCode: activeDocRecord.ma_nhom,
          parentNhomName: activeDocRecord.loai_tai_lieu.nhom_tai_lieu?.ten_nhom || activeDocRecord.ma_nhom,
        },
      ];
    }
    return allowedList;
  }, [allActiveTypes, activeDocRecord, docModalMode, hasTaiLieuGroupPermission]);

  const selectedLoaiTaiLieu = useMemo(
    () => modalLoaiTaiLieuOptions.find((item) => item.id === watchedLoaiTaiLieuId) || null,
    [modalLoaiTaiLieuOptions, watchedLoaiTaiLieuId],
  );

  const selectedCustomFields = useMemo(
    () => getCustomFields(selectedLoaiTaiLieu),
    [selectedLoaiTaiLieu],
  );

  // Tài liệu built-in gắn trên hồ sơ (hồ sơ chung & thông tin chi tiết/đặc thù)
  const builtInChungItems: BuiltInDocItem[] = useMemo(() => {
    const items: BuiltInDocItem[] = [];
    if (hoSo.ho_so_luu_url) {
      items.push({
        id: 'builtin-chung-ho_so_luu_url',
        ten_tai_lieu: 'Thư mục Hồ sơ lưu trữ',
        field_key: 'ho_so_luu_url',
        is_chung: true,
        url: getFullUrl(hoSo.ho_so_luu_url),
        raw_url: hoSo.ho_so_luu_url,
      });
    }
    if (hoSo.tai_lieu_quy_dinh_url) {
      items.push({
        id: 'builtin-chung-tai_lieu_quy_dinh_url',
        ten_tai_lieu: 'Văn bản quy định tạm thời',
        field_key: 'tai_lieu_quy_dinh_url',
        is_chung: true,
        url: getFullUrl(hoSo.tai_lieu_quy_dinh_url),
        raw_url: hoSo.tai_lieu_quy_dinh_url,
      });
    }
    return items;
  }, [hoSo.ho_so_luu_url, hoSo.tai_lieu_quy_dinh_url]);

  const builtInDacThuItems: BuiltInDocItem[] = useMemo(() => {
    if (!thongTinRieng) return [];
    const items: BuiltInDocItem[] = [];
    Object.keys(thongTinRieng).forEach((key) => {
      const val = thongTinRieng[key];
      if (
        key !== 'id' &&
        key !== 'ho_so_chung_id' &&
        typeof val === 'string' &&
        val.trim() !== '' &&
        (isFileFieldKey(key, hoSo.loai_ho_so) || isLinkValue(val))
      ) {
        items.push({
          id: `builtin-dacthu-${key}`,
          ten_tai_lieu: getFieldLabel(key, hoSo.loai_ho_so),
          field_key: key,
          is_chung: false,
          url: getFullUrl(val),
          raw_url: val.trim(),
        });
      }
    });
    return items;
  }, [thongTinRieng, hoSo.loai_ho_so]);

  // Đồng bộ các trường link trên hồ sơ & thông tin chi tiết vào đúng loại tài liệu (kể cả Tài liệu chung, Tài liệu đặc thù, nhóm mới)
  const { syncedBuiltInsByLoaiId, unmatchedBuiltInChung, unmatchedBuiltInDacThu } = useMemo(() => {
    const byLoaiId = new Map<number, BuiltInDocItem[]>();
    const unmatchedChung: BuiltInDocItem[] = [];
    const unmatchedDacThu: BuiltInDocItem[] = [];

    for (const item of [...builtInChungItems, ...builtInDacThuItems]) {
      const matchedLoai = matchBuiltInFieldToDocType(item.field_key, item.ten_tai_lieu, allActiveTypes);
      if (matchedLoai) {
        const list = byLoaiId.get(matchedLoai.id) || [];
        list.push(item);
        byLoaiId.set(matchedLoai.id, list);
      } else if (item.is_chung) {
        unmatchedChung.push(item);
      } else {
        unmatchedDacThu.push(item);
      }
    }

    return {
      syncedBuiltInsByLoaiId: byLoaiId,
      unmatchedBuiltInChung: unmatchedChung,
      unmatchedBuiltInDacThu: unmatchedDacThu,
    };
  }, [builtInChungItems, builtInDacThuItems, allActiveTypes]);

  // Chuẩn hóa tài liệu động đã upload
  const dynamicDocs: DynamicDocItem[] = useMemo(() => {
    if (!hoSo.tai_lieu || hoSo.tai_lieu.length === 0) return [];
    const list: DynamicDocItem[] = [];
    for (const tl of hoSo.tai_lieu as TaiLieuHoSo[]) {
      const maNhom = tl.loai_tai_lieu?.nhom_tai_lieu?.ma_nhom || 'TAI_LIEU_CHUNG';
      if (!hasTaiLieuGroupPermission(maNhom, 'VIEW')) continue;
      list.push({
        id: tl.id,
        real_id: tl.id,
        ten_tai_lieu: tl.ten_tai_lieu,
        loai_tai_lieu_id: tl.loai_tai_lieu_id,
        loai_tai_lieu: tl.loai_tai_lieu || null,
        ma_nhom: maNhom,
        url: getFullUrl(tl.duong_dan_url),
        raw_url: tl.duong_dan_url,
        ghi_chu: tl.ghi_chu,
        so_phien_ban: tl.so_phien_ban || 1,
        tai_lieu_hien_hanh: tl.tai_lieu_hien_hanh !== false,
        ngay_tai_len: tl.ngay_tai_len,
        ngay_hieu_luc: tl.ngay_hieu_luc,
        ngay_het_hieu_luc: tl.ngay_het_hieu_luc,
        du_lieu_dac_thu: tl.du_lieu_dac_thu || null,
      });
    }
    return list;
  }, [hoSo.tai_lieu, hasTaiLieuGroupPermission]);

  const docsByLoaiId = useMemo(() => {
    const map = new Map<number, DynamicDocItem[]>();
    for (const doc of dynamicDocs) {
      const arr = map.get(doc.loai_tai_lieu_id) || [];
      arr.push(doc);
      map.set(doc.loai_tai_lieu_id, arr);
    }
    return map;
  }, [dynamicDocs]);

  // Các tài liệu thuộc loại đã ngưng sử dụng hoặc không còn nằm trong visibleGroups
  const orphanDocs = useMemo(() => {
    const knownTypeIds = new Set<number>();
    for (const g of visibleGroups) {
      for (const lt of g.loai_tai_lieu || []) {
        knownTypeIds.add(lt.id);
      }
    }
    return dynamicDocs.filter((doc) => !knownTypeIds.has(doc.loai_tai_lieu_id));
  }, [dynamicDocs, visibleGroups]);

  // --- Modal & File Handlers (khai báo trước groupTabItems để tránh TDZ trong useMemo) ---
  const handleOpenCreateModal = (presetLoai?: LoaiTaiLieu) => {
    setActiveDocRecord(null);
    setDocModalMode('create');
    form.resetFields();
    const defaultLoai = presetLoai || uploadableTypes[0];
    form.setFieldsValue({
      loai_tai_lieu_id: defaultLoai?.id,
      ten_tai_lieu: presetLoai ? presetLoai.ten_loai_tai_lieu : undefined,
    });
  };

  const handleOpenEditModal = (record: DynamicDocItem) => {
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

  const handleOpenReplaceModal = (record: DynamicDocItem) => {
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
        message.success('Tải lên tài liệu thành công!');
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

  const handleUploadReplaceBuiltIn = async (file: File, item: BuiltInDocItem) => {
    if (file.size / 1024 / 1024 >= 50) {
      message.error('File phải nhỏ hơn 50MB!');
      return false;
    }
    setUploadingId(item.id);
    try {
      const response = await uploadFile(file);
      if (response && response.url) {
        const updateData: Record<string, unknown> = item.is_chung
          ? { [item.field_key]: response.url }
          : {
              thong_tin_rieng: {
                ...(thongTinRieng || {}),
                [item.field_key]: response.url,
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

  const handleDeleteDocument = (record: DynamicDocItem) => {
    deleteTaiLieu(
      { id: hoSo.id, taiLieuId: record.real_id },
      {
        onSuccess: () => message.success('Xóa tài liệu thành công'),
        onError: () => message.error('Lỗi khi xóa tài liệu'),
      },
    );
  };

  const handleViewFile = async (url: string, rowId: string | number) => {
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
    const resolvedApiBase =
      typeof window !== 'undefined'
        ? new URL(apiUrl, window.location.origin).href.replace(/\/+$/, '')
        : apiUrl;

    if (
      url &&
      (url.startsWith('http://') || url.startsWith('https://')) &&
      !url.startsWith(resolvedApiBase)
    ) {
      window.open(url, '_blank');
      return;
    }

    const requestUrl =
      apiUrl.startsWith('/') && url.startsWith(`${apiUrl}/`)
        ? url.slice(apiUrl.length)
        : url;

    setViewingId(rowId);
    try {
      const response = await axiosInstance.get(requestUrl, {
        responseType: 'blob',
      });
      const fileUrl = window.URL.createObjectURL(response as unknown as Blob);
      window.open(fileUrl, '_blank');
    } catch {
      message.error('Lỗi khi mở tài liệu hoặc file không tồn tại');
    } finally {
      setViewingId(null);
    }
  };

  const renderBuiltInDocRow = (
    bItem: BuiltInDocItem,
    maNhom: string,
    isSyncedToType = false,
  ) => {
    const canViewBuiltIn = hasTaiLieuGroupPermission(maNhom, 'VIEW');
    const canReplaceBuiltIn = hasTaiLieuGroupPermission(maNhom, 'REPLACE');

    return (
      <div
        key={bItem.id}
        className={`border rounded-lg p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
          isSyncedToType
            ? 'border-blue-100 bg-blue-50/30'
            : 'border-slate-200 bg-slate-50/50 p-3'
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {isSyncedToType ? (
              <>
                <Tag color="cyan" className="m-0 text-[11px]">
                  Đồng bộ từ hồ sơ
                </Tag>
                <span className="font-medium text-sm text-gray-800 break-words">
                  {bItem.ten_tai_lieu}
                </span>
              </>
            ) : (
              <>
                <Tag color="blue" className="m-0 text-xs font-medium">
                  {bItem.ten_tai_lieu}
                </Tag>
                <Tag color="default" className="m-0 text-[11px]">
                  Trường hệ thống
                </Tag>
              </>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1 truncate max-w-xl" title={bItem.raw_url}>
            {bItem.raw_url}
          </div>
        </div>
        <Space size="small" wrap className="shrink-0">
          {canViewBuiltIn && (
            <Button
              type="primary"
              ghost
              size="small"
              icon={<EyeOutlined />}
              loading={viewingId === bItem.id}
              onClick={() => handleViewFile(bItem.url, bItem.id)}
            >
              Mở xem
            </Button>
          )}
          {canUpdate && canReplaceBuiltIn && (
            <Upload
              beforeUpload={(file) => handleUploadReplaceBuiltIn(file, bItem)}
              showUploadList={false}
              maxCount={1}
            >
              <Button
                size="small"
                icon={<UploadOutlined />}
                loading={uploadingId === bItem.id}
              >
                Thay thế file
              </Button>
            </Upload>
          )}
        </Space>
      </div>
    );
  };

  const renderDynamicDocDetails = (doc: DynamicDocItem, maNhom: string) => {
    const canViewDoc = hasTaiLieuGroupPermission(maNhom, 'VIEW');
    const canEditDoc =
      hasTaiLieuGroupPermission(maNhom, 'UPLOAD') || hasTaiLieuGroupPermission(maNhom, 'REPLACE');
    const canReplaceDoc = hasTaiLieuGroupPermission(maNhom, 'REPLACE');
    const canDeleteDoc = hasTaiLieuGroupPermission(maNhom, 'DELETE');
    const fields = getCustomFields(doc.loai_tai_lieu);

    return (
      <div
        key={doc.id}
        className={`flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 p-2.5 rounded-lg border ${
          doc.tai_lieu_hien_hanh
            ? 'bg-white border-slate-200'
            : 'bg-slate-50/70 border-dashed border-slate-200 opacity-85'
        }`}
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            {doc.tai_lieu_hien_hanh ? (
              <Tag color="green" className="text-[11px] m-0">
                Hiện hành • v{doc.so_phien_ban}
              </Tag>
            ) : (
              <Tag color="default" className="text-[11px] m-0">
                Bản cũ • v{doc.so_phien_ban}
              </Tag>
            )}
            <span className="font-medium text-sm text-gray-800 break-words">
              {doc.ten_tai_lieu}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            {(doc.ngay_hieu_luc || doc.ngay_het_hieu_luc) && (
              <span className="inline-flex items-center gap-1">
                <CalendarOutlined className="text-gray-400" />
                {doc.ngay_hieu_luc ? `HL: ${formatDateDisplay(doc.ngay_hieu_luc)}` : ''}
                {doc.ngay_hieu_luc && doc.ngay_het_hieu_luc ? ' • ' : ''}
                {doc.ngay_het_hieu_luc ? (
                  <span className="text-orange-600">
                    HH: {formatDateDisplay(doc.ngay_het_hieu_luc)}
                  </span>
                ) : null}
              </span>
            )}
            {doc.ngay_tai_len && (
              <span>Tải lên: {dayjs(doc.ngay_tai_len).format('DD/MM/YYYY HH:mm')}</span>
            )}
            {doc.ghi_chu && <span className="text-gray-400 italic">Ghi chú: {doc.ghi_chu}</span>}
          </div>

          {doc.du_lieu_dac_thu && Object.keys(doc.du_lieu_dac_thu).length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {Object.entries(doc.du_lieu_dac_thu).map(([key, value]) => {
                if (value === undefined || value === null || value === '') return null;
                const fieldCfg = fields.find((f) => f.key === key);
                const label = fieldCfg?.label || key;
                if (isLinkValue(value, fieldCfg)) {
                  const full = getFullUrl(String(value));
                  return (
                    <Button
                      key={key}
                      type="link"
                      size="small"
                      className="!p-0 !h-auto text-xs"
                      icon={<LinkOutlined />}
                      onClick={() => handleViewFile(full, `${doc.id}-${key}`)}
                    >
                      {label}
                    </Button>
                  );
                }
                const display = fieldCfg?.type === 'date' ? formatDateDisplay(value) : String(value);
                return (
                  <Tag key={key} color="default" className="text-[11px] m-0">
                    {label}: {display}
                  </Tag>
                );
              })}
            </div>
          )}
        </div>

        <Space size="small" wrap className="shrink-0">
          {canViewDoc && (
            <Button
              type="primary"
              ghost
              size="small"
              icon={<EyeOutlined />}
              loading={viewingId === doc.id}
              onClick={() => handleViewFile(doc.url, doc.id)}
            >
              Mở xem
            </Button>
          )}
          {canEditDoc && doc.tai_lieu_hien_hanh && (
            <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenEditModal(doc)}>
              Sửa
            </Button>
          )}
          {canReplaceDoc && doc.tai_lieu_hien_hanh && (
            <Button size="small" icon={<UploadOutlined />} onClick={() => handleOpenReplaceModal(doc)}>
              Thay thế
            </Button>
          )}
          {canDeleteDoc && (
            <Popconfirm
              title="Xóa tài liệu này?"
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDeleteDocument(doc)}
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      </div>
    );
  };

  const groupTabItems = useMemo(() => {
    const getDeduplicatedSyncedBuiltIns = (loaiId: number, activeDocs: DynamicDocItem[]) => {
      const candidates = syncedBuiltInsByLoaiId.get(loaiId) || [];
      if (candidates.length === 0) return [];
      const existingUrls = new Set(activeDocs.map((d) => normalizeComparableUrl(d.raw_url)));
      return candidates.filter((item) => !existingUrls.has(normalizeComparableUrl(item.raw_url)));
    };

    const items = visibleGroups.map((group) => {
      const typesInGroup = group.loai_tai_lieu || [];
      const canUploadGroup = hasTaiLieuGroupPermission(group.ma_nhom, 'UPLOAD');
      const builtInForGroup =
        group.ma_nhom === 'TAI_LIEU_CHUNG'
          ? unmatchedBuiltInChung
          : group.ma_nhom === 'TAI_LIEU_DAC_THU'
            ? unmatchedBuiltInDacThu
            : [];

      const activeCountInTypes = typesInGroup.reduce((sum, loai) => {
        const docs = docsByLoaiId.get(loai.id) || [];
        const activeDocs = docs.filter((d) => d.tai_lieu_hien_hanh);
        const syncedBuiltIns = getDeduplicatedSyncedBuiltIns(loai.id, activeDocs);
        return sum + activeDocs.length + syncedBuiltIns.length;
      }, 0);
      const uploadedCount = builtInForGroup.length + activeCountInTypes;

      return {
        key: group.ma_nhom,
        label: (
          <span className="inline-flex items-center gap-1.5 font-medium">
            <FolderOpenOutlined />
            <span>{group.ten_nhom}</span>
            <Badge
              count={uploadedCount}
              showZero
              color={uploadedCount > 0 ? '#1677ff' : '#cbd5e1'}
              style={{ boxShadow: 'none' }}
            />
          </span>
        ),
        children: (
          <div className="space-y-3 pt-1">
            {(group.mo_ta || (canUploadGroup && typesInGroup.length > 0)) && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <Text type="secondary" className="text-xs">
                  {group.mo_ta || `Danh sách các loại tài liệu thuộc nhóm "${group.ten_nhom}"`}
                </Text>
                {canUploadGroup && typesInGroup.length > 0 && (
                  <Button
                    size="small"
                    type="primary"
                    ghost
                    icon={<PlusOutlined />}
                    onClick={() => handleOpenCreateModal(typesInGroup[0])}
                    className="self-start sm:self-center shrink-0"
                  >
                    Tải lên vào nhóm
                  </Button>
                )}
              </div>
            )}

            {/* Các trường file hệ thống chưa gán vào loại tài liệu riêng */}
            {builtInForGroup.map((bItem) => renderBuiltInDocRow(bItem, group.ma_nhom, false))}

            {/* Danh sách các Loại tài liệu cấu hình bên trong Nhóm */}
            {typesInGroup.length === 0 && builtInForGroup.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400 border border-dashed border-slate-200 rounded-lg">
                Nhóm này chưa cấu hình loại tài liệu áp dụng cho loại hồ sơ hiện tại.
              </div>
            ) : (
              typesInGroup.map((loai) => {
                const docs = docsByLoaiId.get(loai.id) || [];
                const activeDocs = docs.filter((d) => d.tai_lieu_hien_hanh);
                const oldDocs = docs.filter((d) => !d.tai_lieu_hien_hanh);
                const syncedBuiltIns = getDeduplicatedSyncedBuiltIns(loai.id, activeDocs);
                const totalActive = activeDocs.length + syncedBuiltIns.length;
                const historyExpanded = Boolean(showHistoryMap[loai.id]);

                return (
                  <div
                    key={loai.id}
                    className="border border-slate-200 rounded-lg p-3 bg-white hover:border-blue-200 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <FileTextOutlined className="text-slate-400" />
                          <Tag
                            color={getLoaiHoSoAntdColor(loai.ma_loai_tai_lieu, loai.mau_sac)}
                            className="font-semibold m-0 text-xs px-2 py-0.5"
                          >
                            {loai.ten_loai_tai_lieu}
                          </Tag>
                          {totalActive === 0 ? (
                            <Tag color="default" className="text-[11px] m-0">
                              Chưa tải lên
                            </Tag>
                          ) : (
                            <Tag color="blue" className="text-[11px] m-0">
                              {totalActive} tệp hiện hành
                            </Tag>
                          )}
                          {oldDocs.length > 0 && (
                            <Button
                              type="link"
                              size="small"
                              icon={<HistoryOutlined />}
                              className="!p-0 !h-auto text-xs text-gray-500"
                              onClick={() =>
                                setShowHistoryMap((prev) => ({
                                  ...prev,
                                  [loai.id]: !prev[loai.id],
                                }))
                              }
                            >
                              {historyExpanded ? 'Ẩn bản cũ' : `${oldDocs.length} phiên bản cũ`}
                            </Button>
                          )}
                        </div>
                        {loai.mo_ta && (
                          <div className="text-xs text-gray-400 mt-1">{loai.mo_ta}</div>
                        )}
                      </div>

                      {canUploadGroup && (
                        <Button
                          size="small"
                          type={totalActive === 0 ? 'primary' : 'default'}
                          icon={<PlusOutlined />}
                          onClick={() => handleOpenCreateModal(loai)}
                          className="self-start sm:self-center shrink-0"
                        >
                          {totalActive === 0 ? 'Tải lên' : 'Thêm tệp'}
                        </Button>
                      )}
                    </div>

                    {totalActive > 0 ? (
                      <div className="space-y-2 mt-2.5">
                        {activeDocs.map((doc) => renderDynamicDocDetails(doc, group.ma_nhom))}
                        {syncedBuiltIns.map((bItem) =>
                          renderBuiltInDocRow(bItem, group.ma_nhom, true),
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 italic pt-2">
                        Chưa có tài liệu nào được tải lên cho mục &quot;{loai.ten_loai_tai_lieu}&quot;.
                      </div>
                    )}

                    {historyExpanded && oldDocs.length > 0 && (
                      <div className="space-y-2 mt-2.5 pt-2.5 border-t border-dashed border-slate-200">
                        <div className="text-[11px] font-medium text-gray-500">
                          Lịch sử phiên bản trước:
                        </div>
                        {oldDocs.map((doc) => renderDynamicDocDetails(doc, group.ma_nhom))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ),
      };
    });

    const hiddenChungBuiltIns =
      !visibleGroups.some((g) => g.ma_nhom === 'TAI_LIEU_CHUNG') &&
      hasTaiLieuGroupPermission('TAI_LIEU_CHUNG', 'VIEW')
        ? unmatchedBuiltInChung.map((item) => ({ item, maNhom: 'TAI_LIEU_CHUNG' }))
        : [];
    const hiddenDacThuBuiltIns =
      !visibleGroups.some((g) => g.ma_nhom === 'TAI_LIEU_DAC_THU') &&
      hasTaiLieuGroupPermission('TAI_LIEU_DAC_THU', 'VIEW')
        ? unmatchedBuiltInDacThu.map((item) => ({ item, maNhom: 'TAI_LIEU_DAC_THU' }))
        : [];
    const fallbackBuiltIns = [...hiddenChungBuiltIns, ...hiddenDacThuBuiltIns];

    if (orphanDocs.length > 0 || fallbackBuiltIns.length > 0) {
      const otherCount = orphanDocs.length + fallbackBuiltIns.length;
      items.push({
        key: '__ORPHAN__',
        label: (
          <span className="inline-flex items-center gap-1.5 font-medium">
            <FileTextOutlined />
            <span>Tài liệu khác</span>
            <Badge count={otherCount} showZero color="#64748b" style={{ boxShadow: 'none' }} />
          </span>
        ),
        children: (
          <div className="space-y-2 pt-1">
            {fallbackBuiltIns.map(({ item, maNhom }) => renderBuiltInDocRow(item, maNhom, false))}
            {orphanDocs.map((doc) => renderDynamicDocDetails(doc, doc.ma_nhom))}
          </div>
        ),
      });
    }

    return items;
  }, [
    visibleGroups,
    orphanDocs,
    unmatchedBuiltInChung,
    unmatchedBuiltInDacThu,
    syncedBuiltInsByLoaiId,
    docsByLoaiId,
    showHistoryMap,
    hasTaiLieuGroupPermission,
    viewingId,
    uploadingId,
    canUpdate,
  ]);

  const resolvedActiveTab = useMemo(() => {
    if (activeGroupTab && groupTabItems.some((item) => item.key === activeGroupTab)) {
      return activeGroupTab;
    }
    return groupTabItems[0]?.key;
  }, [activeGroupTab, groupTabItems]);

  return (
    <div className="space-y-3">
      {uploadableTypes.length > 0 && (
        <div className="flex justify-end sm:hidden">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenCreateModal()}
            className="w-full"
          >
            Tải thêm tài liệu
          </Button>
        </div>
      )}

      {groupTabItems.length === 0 ? (
        <Empty
          description={
            visibleGroups.length === 0
              ? 'Bạn chưa được cấp quyền xem nhóm tài liệu nào trên hồ sơ này'
              : 'Chưa có nhóm tài liệu phù hợp'
          }
          className="my-10"
        />
      ) : (
        <Tabs
          type="card"
          activeKey={resolvedActiveTab}
          onChange={(key) => setActiveGroupTab(key)}
          items={groupTabItems}
          tabBarExtraContent={
            uploadableTypes.length > 0 ? (
              <div className="hidden sm:block pl-2">
                <Button
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    const activeGroup = visibleGroups.find((g) => g.ma_nhom === resolvedActiveTab);
                    const firstUploadableInTab = (activeGroup?.loai_tai_lieu || [])[0];
                    handleOpenCreateModal(
                      hasTaiLieuGroupPermission(activeGroup?.ma_nhom, 'UPLOAD')
                        ? firstUploadableInTab
                        : undefined,
                    );
                  }}
                >
                  Tải thêm tài liệu
                </Button>
              </div>
            ) : null
          }
        />
      )}

      {/* MODAL THÊM / SỬA / THAY THẾ TÀI LIỆU ĐÍNH KÈM */}
      <Modal
        title={
          docModalMode === 'create'
            ? 'Tải lên tài liệu đính kèm'
            : docModalMode === 'edit'
              ? `Chỉnh sửa thông tin tài liệu (v${activeDocRecord?.so_phien_ban || 1})`
              : `Thay thế tài liệu (Sẽ tạo phiên bản v${(activeDocRecord?.so_phien_ban || 1) + 1})`
        }
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
                  onChange={(val) => {
                    form.setFieldValue('du_lieu_dac_thu', undefined);
                    if (docModalMode === 'create') {
                      const picked = modalLoaiTaiLieuOptions.find((t) => t.id === val);
                      if (picked && !form.getFieldValue('ten_tai_lieu')) {
                        form.setFieldValue('ten_tai_lieu', picked.ten_loai_tai_lieu);
                      }
                    }
                  }}
                >
                  {modalLoaiTaiLieuOptions.map((item) => (
                    <Select.Option
                      key={item.id}
                      value={item.id}
                      label={`${item.parentNhomName} - ${item.ten_loai_tai_lieu}`}
                    >
                      <span className="text-xs text-gray-400 mr-1.5">[{item.parentNhomName}]</span>
                      <Tag
                        color={getLoaiHoSoAntdColor(item.ma_loai_tai_lieu, item.mau_sac)}
                        className="m-0"
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
                label="Tên tài liệu / Tiêu đề tệp"
                rules={[{ required: true, message: 'Vui lòng nhập tên tài liệu' }]}
              >
                <Input placeholder="VD: TCCS số 01/2026..." />
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
                Thông tin riêng mục &quot;{selectedLoaiTaiLieu?.ten_loai_tai_lieu}&quot;
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
