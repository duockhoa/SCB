export type CustomFieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'file';

export interface CustomFieldConfig {
  key: string;
  label: string;
  type: CustomFieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  colSpan?: 12 | 24;
}

export interface LoaiHoSo {
  id: number;
  ma_loai: string;
  ten_loai: string;
  mo_ta?: string | null;
  mau_sac?: string | null;
  thu_tu?: number;
  trang_thai?: boolean;
  thoi_gian_canh_bao?: number;
  don_vi_canh_bao?: 'THANG' | 'NGAY' | string;
  cau_hinh_truong?: CustomFieldConfig[] | null;
  is_system?: boolean;
  so_luong_ho_so?: number;
}

export interface LoaiHoSoRef {
  id: number;
  ma_loai: string;
  ten_loai: string;
  mau_sac?: string | null;
}

export interface LoaiTaiLieu {
  id: number;
  ma_loai_tai_lieu: string;
  ten_loai_tai_lieu: string;
  mo_ta?: string | null;
  mau_sac?: string | null;
  thu_tu?: number;
  trang_thai?: boolean;
  ap_dung_tat_ca?: boolean;
  cau_hinh_truong?: CustomFieldConfig[] | null;
  is_system?: boolean;
  so_luong_tai_lieu?: number;
  loai_ho_so_ids?: number[];
  loai_ho_so_list?: LoaiHoSoRef[];
}

export interface TaiLieuHoSo {
  id: number;
  ho_so_chung_id: number;
  loai_tai_lieu_id: number;
  loai_tai_lieu?: LoaiTaiLieu | null;
  ten_tai_lieu: string;
  duong_dan_url: string;
  so_phien_ban?: number;
  tai_lieu_hien_hanh?: boolean;
  ngay_hieu_luc?: string | null;
  ngay_het_hieu_luc?: string | null;
  ghi_chu?: string | null;
  du_lieu_dac_thu?: Record<string, unknown> | null;
  ngay_tai_len?: string;
  nguoi_tai_len_id?: number | null;
  nguoi_tai_len?: { id: number; ho_ten: string } | null;
}

export interface TinhTrang {
  id: number;
  ma_tinh_trang: string;
  ten_tinh_trang: string;
  mau_sac: string;
}

export interface HoSoChung {
  id: number;
  ma_ho_so: string;
  so_chinh?: string;
  ten_san_pham: string;
  ten_san_pham_khong_dau?: string;
  ma_san_pham_noi_bo?: string;
  ngay_cong_bo?: string;
  ngay_het_han?: string;
  ngay_nhac_han?: string;
  ap_dung_quy_dinh_tam_thoi?: boolean;
  ngay_het_han_quy_dinh?: string;
  can_cu_quy_dinh?: string;
  tai_lieu_quy_dinh_url?: string;
  tinh_trang_id?: number;
  tinh_trang?: TinhTrang;
  ghi_chu?: string;
  ho_so_luu_url?: string;
  loai_ho_so_id?: number;
  loai_ho_so?: LoaiHoSo;
  cong_ty_so_huu_id?: number;
  cong_ty_dung_ten_id?: number;
  cong_ty_phan_phoi_id?: number;
  du_lieu_dac_thu?: Record<string, any> | null;

  lich_su_thay_doi?: any[];
  nhat_ky?: any[];
  tai_lieu?: TaiLieuHoSo[];

  // Dynamic relations (6 loại hệ thống)
  ho_so_thuoc?: any;
  ho_so_my_pham?: any;
  ho_so_tbyt?: any;
  ho_so_tpbvsk_cong_bo?: any;
  ho_so_tpbvsk_tu_cong_bo?: any;
  ho_so_cfs_cpp?: any;
}
