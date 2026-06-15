import { HoSoChung } from '@/types/ho-so.type';

export interface DashboardStats {
  tongSo: number;
  dangXuLy: number;
  conHieuLuc: number;
  sapHetHan: number;
  daHetHan: number;
  thayThe: number;
  thuHoi: number;
}

export const calculateDashboardStats = (hoSoList: HoSoChung[] = []): DashboardStats => {
  return {
    tongSo: hoSoList.length,
    dangXuLy: hoSoList.filter(hs => hs.tinh_trang?.ma_tinh_trang === 'DANG_XU_LY').length,
    conHieuLuc: hoSoList.filter(hs => hs.tinh_trang?.ma_tinh_trang === 'CON_HIEU_LUC').length,
    sapHetHan: hoSoList.filter(hs => hs.tinh_trang?.ma_tinh_trang === 'SAP_HET_HAN').length,
    daHetHan: hoSoList.filter(hs => hs.tinh_trang?.ma_tinh_trang === 'DA_HET_HAN').length,
    thayThe: hoSoList.filter(hs => hs.tinh_trang?.ma_tinh_trang === 'DA_BI_THAY_THE').length,
    thuHoi: hoSoList.filter(hs => hs.tinh_trang?.ma_tinh_trang === 'BI_THU_HOI').length,
  };
};

export const getAlertList = (hoSoList: HoSoChung[] = []) => {
  // Lọc ra các hồ sơ Sắp hết hạn và Đã hết hạn
  const alerts = hoSoList.filter(
    hs => hs.tinh_trang?.ma_tinh_trang === 'SAP_HET_HAN' || hs.tinh_trang?.ma_tinh_trang === 'DA_HET_HAN'
  );

  // Sort theo ngày hết hạn tăng dần (những cái nào gần hạn hoặc quá hạn nhất sẽ lên đầu)
  return alerts.sort((a, b) => {
    if (!a.ngay_het_han) return 1;
    if (!b.ngay_het_han) return -1;
    return new Date(a.ngay_het_han).getTime() - new Date(b.ngay_het_han).getTime();
  });
};
