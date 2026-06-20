import { useQuery } from '@tanstack/react-query';
import { danhMucService } from '@/services/danh-muc.service';

export const useLoaiHoSoList = () => {
  return useQuery({
    queryKey: ['DANH_MUC', 'LOAI_HO_SO'],
    queryFn: () => danhMucService.getLoaiHoSo(),
  });
};

export const useTinhTrangList = () => {
  return useQuery({
    queryKey: ['DANH_MUC', 'TINH_TRANG'],
    queryFn: () => danhMucService.getTinhTrang(),
  });
};

export const useLoaiThayDoiList = () => {
  return useQuery({
    queryKey: ['DANH_MUC', 'LOAI_THAY_DOI'],
    queryFn: () => danhMucService.getLoaiThayDoi(),
  });
};
