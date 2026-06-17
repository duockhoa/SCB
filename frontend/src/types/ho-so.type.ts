export interface LoaiHoSo {
  id: number;
  ma_loai: string;
  ten_loai: string;
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
  tinh_trang_id?: number;
  tinh_trang?: TinhTrang;
  ghi_chu?: string;
  ho_so_luu_url?: string;
  loai_ho_so_id?: number;
  loai_ho_so?: LoaiHoSo;
  cong_ty_so_huu_id?: number;
  cong_ty_dung_ten_id?: number;
  cong_ty_phan_phoi_id?: number;
  
  lich_su_thay_doi?: any[];
  nhat_ky?: any[];
  tai_lieu?: any[];
  
  // Dynamic relations
  ho_so_thuoc?: any;
  ho_so_my_pham?: any;
  ho_so_tbyt?: any;
  ho_so_tpbvsk_cong_bo?: any;
  ho_so_tpbvsk_tu_cong_bo?: any;
  ho_so_cfs_cpp?: any;
}
