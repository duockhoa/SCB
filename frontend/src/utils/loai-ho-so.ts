import type { CustomFieldConfig, LoaiHoSo } from '@/types/ho-so.type';

export interface ColorOption {
  value: string;
  label: string;
  tailwindClass: string;
  antdColor: string;
}

export const LOAI_HO_SO_COLORS: ColorOption[] = [
  { value: 'red', label: 'Đỏ', tailwindClass: 'text-red-600 bg-red-50 border-red-200', antdColor: 'red' },
  { value: 'pink', label: 'Hồng', tailwindClass: 'text-pink-600 bg-pink-50 border-pink-200', antdColor: 'magenta' },
  { value: 'purple', label: 'Tím', tailwindClass: 'text-violet-600 bg-violet-50 border-violet-200', antdColor: 'purple' },
  { value: 'green', label: 'Xanh lá', tailwindClass: 'text-emerald-600 bg-emerald-50 border-emerald-200', antdColor: 'green' },
  { value: 'teal', label: 'Xanh ngọc', tailwindClass: 'text-teal-600 bg-teal-50 border-teal-200', antdColor: 'cyan' },
  { value: 'amber', label: 'Vàng hổ phách', tailwindClass: 'text-amber-600 bg-amber-50 border-amber-200', antdColor: 'gold' },
  { value: 'blue', label: 'Xanh dương', tailwindClass: 'text-blue-600 bg-blue-50 border-blue-200', antdColor: 'blue' },
  { value: 'indigo', label: 'Chàm', tailwindClass: 'text-indigo-600 bg-indigo-50 border-indigo-200', antdColor: 'geekblue' },
  { value: 'orange', label: 'Cam', tailwindClass: 'text-orange-600 bg-orange-50 border-orange-200', antdColor: 'orange' },
];

const LEGACY_CODE_COLOR_MAP: Record<string, string> = {
  THUOC: 'red',
  MY_PHAM: 'pink',
  TBYT: 'purple',
  TPBVSK_CONG_BO: 'green',
  TPBVSK_TU_CONG_BO: 'teal',
  CFS_CPP: 'amber',
};

const FALLBACK_PALETTE = ['blue', 'indigo', 'orange', 'teal', 'purple', 'green', 'pink', 'amber'];

function resolveColorKey(maLoai?: string, mauSac?: string | null): string {
  if (mauSac && LOAI_HO_SO_COLORS.some((c) => c.value === mauSac)) {
    return mauSac;
  }
  if (maLoai && LEGACY_CODE_COLOR_MAP[maLoai]) {
    return LEGACY_CODE_COLOR_MAP[maLoai];
  }
  if (!maLoai) return 'blue';
  let hash = 0;
  for (let i = 0; i < maLoai.length; i++) {
    hash = (hash * 31 + maLoai.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_PALETTE[hash % FALLBACK_PALETTE.length];
}

export function getLoaiHoSoColorClass(maLoai?: string, mauSac?: string | null): string {
  const key = resolveColorKey(maLoai, mauSac);
  return LOAI_HO_SO_COLORS.find((c) => c.value === key)?.tailwindClass || 'text-blue-600 bg-blue-50 border-blue-200';
}

export function getLoaiHoSoAntdColor(maLoai?: string, mauSac?: string | null): string {
  const key = resolveColorKey(maLoai, mauSac);
  return LOAI_HO_SO_COLORS.find((c) => c.value === key)?.antdColor || 'blue';
}

export const SYSTEM_BUILT_IN_FIELDS_SUMMARY: Record<string, string[]> = {
  THUOC: ['Hoạt chất - Hàm lượng', 'Dạng bào chế', 'Quy cách đóng gói', 'Đợt cấp số', 'Gia hạn', 'Quyết định cấp SĐK', 'Kê khai/Công bố giá', 'Hồ sơ Quảng cáo'],
  MY_PHAM: ['Nhãn hàng', 'Dạng mỹ phẩm', 'Hồ sơ bị thay thế / Ghi chú', 'Phiếu công bố', 'Xác nhận Quảng cáo'],
  TBYT: ['Tên TBYT / Chủng loại', 'Phân loại (A/B/C/D)', 'Chủ sở hữu', 'Phiếu tiếp nhận', 'Tài liệu Mô tả Kỹ thuật', 'Tiêu chuẩn Cơ sở', 'Mẫu nhãn', 'HDSD', 'Hồ sơ Quảng cáo'],
  TPBVSK_CONG_BO: ['Thành phần', 'Chủ sở hữu', 'Phiếu công bố', 'Xác nhận Quảng cáo'],
  TPBVSK_TU_CONG_BO: ['Cơ sở đứng tên', 'Dạng sản phẩm'],
  CFS_CPP: ['Loại hình (CPP/CFS)', 'Nước xuất khẩu', 'Công văn cấp'],
};

const LEGACY_FIELD_DICTIONARY: Record<string, string> = {
  id: 'ID',
  ho_so_chung_id: 'ID hồ sơ chung',
  hoat_chat_ham_luong: 'Hoạt chất hàm lượng',
  bao_che: 'Bào chế',
  quy_cach_dong_goi: 'Quy cách đóng gói',
  dot_cap_so: 'Đợt cấp số',
  gia_han: 'Gia hạn',
  quyet_dinh_cap_sdk_url: 'Quyết định cấp SĐK',
  ke_khai_gia_url: 'Kê khai giá',
  quang_cao_url: 'Quảng cáo',
  nhan_hang: 'Nhãn hàng',
  dang_my_pham: 'Dạng mỹ phẩm',
  phieu_cong_bo_url: 'Phiếu công bố',
  hs_thay_the_ghi_chu: 'Hồ sơ thay thế / Ghi chú',
  xn_quang_cao_url: 'Xác nhận quảng cáo',
  ten_thuong_mai: 'Tên thương mại',
  ten_tbyt_chung_loai: 'Tên TBYT chủng loại',
  phan_loai: 'Phân loại',
  chu_so_huu: 'Chủ sở hữu',
  phieu_tiep_nhan_url: 'Phiếu tiếp nhận',
  tai_lieu_mo_ta_kt_url: 'Tài liệu mô tả kỹ thuật',
  tieu_chuan_co_so_url: 'Tiêu chuẩn cơ sở',
  nhan_url: 'Nhãn',
  hdsd_url: 'Hướng dẫn sử dụng',
  co_so_dung_ten: 'Cơ sở đứng tên',
  dang_san_pham: 'Dạng sản phẩm',
  thanh_phan: 'Thành phần',
  loai_hinh: 'Loại hình',
  nuoc_xuat_khau: 'Nước xuất khẩu',
  cong_van_cap_url: 'Công văn cấp',
  ban_tu_cong_bo_url: 'Bản tự công bố',
  nhan_san_pham_url: 'Nhãn sản phẩm',
};

export function extractThongTinRieng(hoSo: unknown): Record<string, unknown> | null {
  if (!hoSo || typeof hoSo !== 'object') return null;
  const record = hoSo as Record<string, unknown>;

  const dacThuKey = Object.keys(record).find(
    (key) =>
      key.startsWith('ho_so_') &&
      record[key] &&
      typeof record[key] === 'object' &&
      !Array.isArray(record[key]) &&
      key !== 'ho_so_chung' &&
      key !== 'ho_so_cu',
  );

  const legacyVal = dacThuKey ? record[dacThuKey] : null;
  const legacyObj =
    legacyVal && typeof legacyVal === 'object' && !Array.isArray(legacyVal)
      ? (legacyVal as Record<string, unknown>)
      : null;
  const dynamicVal = record.du_lieu_dac_thu;
  const dynamicObj =
    dynamicVal && typeof dynamicVal === 'object' && !Array.isArray(dynamicVal)
      ? (dynamicVal as Record<string, unknown>)
      : null;

  if (!legacyObj && !dynamicObj) return null;
  return {
    ...(legacyObj || {}),
    ...(dynamicObj || {}),
  };
}

export function getCustomFields(loaiHoSo?: LoaiHoSo | null): CustomFieldConfig[] {
  if (!loaiHoSo?.cau_hinh_truong || !Array.isArray(loaiHoSo.cau_hinh_truong)) {
    return [];
  }
  return loaiHoSo.cau_hinh_truong;
}

export function findFieldConfig(key: string, loaiHoSo?: LoaiHoSo | null): CustomFieldConfig | undefined {
  return getCustomFields(loaiHoSo).find((f) => f.key === key);
}

export function getFieldLabel(key: string, loaiHoSo?: LoaiHoSo | null): string {
  const custom = findFieldConfig(key, loaiHoSo);
  if (custom?.label) return custom.label;
  if (LEGACY_FIELD_DICTIONARY[key]) return LEGACY_FIELD_DICTIONARY[key];

  const words = key.split('_').filter(Boolean);
  if (words.length === 0) return key;
  const first = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  return [first, ...words.slice(1)].join(' ');
}

export function isFileFieldKey(key: string, loaiHoSo?: LoaiHoSo | null): boolean {
  const custom = findFieldConfig(key, loaiHoSo);
  if (custom) return custom.type === 'file';
  return key.endsWith('_url');
}

export function stripVietnameseAccents(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export function toMaLoaiCode(input: string): string {
  return stripVietnameseAccents(input)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50);
}

export function toFieldSnakeKey(input: string): string {
  let key = stripVietnameseAccents(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
  if (key && !/^[a-z]/.test(key)) {
    key = `truong_${key}`;
  }
  return key;
}
