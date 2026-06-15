export interface TinhTrang {
  id: number;
  ten_tinh_trang: string;
  mau_sac: string;
}

export interface HoSoChung {
  id: number;
  ma_ho_so: string;
  so_chinh?: string;
  ten_san_pham: string;
  ngay_cong_bo?: string;
  ngay_het_han?: string;
  ngay_nhac_han?: string;
  tinh_trang_id?: number;
  tinh_trang?: TinhTrang;
  ghi_chu?: string;
  loai_ho_so_id?: number;
  cong_ty_so_huu_id?: number;
  cong_ty_dung_ten_id?: number;
  
  // Dynamic relations
  ho_so_thuoc?: any;
  ho_so_my_pham?: any;
  ho_so_tbyt?: any;
  ho_so_tpbvsk_cong_bo?: any;
  ho_so_tpbvsk_tu_cong_bo?: any;
  ho_so_cfs_cpp?: any;
}
