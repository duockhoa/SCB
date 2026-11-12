import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { danhMucService, type LoaiHoSoPayload } from '@/services/danh-muc.service';

export const useLoaiHoSoList = (includeInactive = false) => {
  return useQuery({
    queryKey: ['DANH_MUC', 'LOAI_HO_SO', { includeInactive }],
    queryFn: () => danhMucService.getLoaiHoSo(includeInactive),
  });
};

export const useCreateLoaiHoSo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LoaiHoSoPayload) => danhMucService.createLoaiHoSo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['DANH_MUC', 'LOAI_HO_SO'] });
    },
  });
};

export const useUpdateLoaiHoSo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: LoaiHoSoPayload }) =>
      danhMucService.updateLoaiHoSo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['DANH_MUC', 'LOAI_HO_SO'] });
      queryClient.invalidateQueries({ queryKey: ['HO_SO'] });
      queryClient.invalidateQueries({ queryKey: ['HOSO_DETAIL'] });
      queryClient.invalidateQueries({ queryKey: ['DASHBOARD'] });
    },
  });
};

export const useDeleteLoaiHoSo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => danhMucService.deleteLoaiHoSo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['DANH_MUC', 'LOAI_HO_SO'] });
    },
  });
};

export const useUpdateLoaiHoSoExpiry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { thoi_gian_canh_bao: number; don_vi_canh_bao?: string; dong_bo_tat_ca?: boolean };
    }) => danhMucService.updateLoaiHoSoExpiry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['DANH_MUC', 'LOAI_HO_SO'] });
      queryClient.invalidateQueries({ queryKey: ['HO_SO'] });
      queryClient.invalidateQueries({ queryKey: ['HOSO_DETAIL'] });
      queryClient.invalidateQueries({ queryKey: ['DASHBOARD'] });
    },
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
