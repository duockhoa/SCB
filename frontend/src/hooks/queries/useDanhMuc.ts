import { useQuery } from '@tanstack/react-query';
import { danhMucService } from '@/services/danh-muc.service';

export const useLoaiHoSoList = () => {
  return useQuery({
    queryKey: ['DANH_MUC', 'LOAI_HO_SO'],
    queryFn: () => danhMucService.getLoaiHoSo(),
  });
};
