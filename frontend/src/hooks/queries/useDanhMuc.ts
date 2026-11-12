import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  danhMucService,
  type LoaiHoSoPayload,
  type LoaiTaiLieuPayload,
  type NhomTaiLieuPayload,
} from '@/services/danh-muc.service';

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

export const useUpdateLoaiHoSoTaiLieuConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { nhom_tai_lieu_ids: number[]; loai_tai_lieu_ids: number[] };
    }) => danhMucService.updateLoaiHoSoTaiLieuConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['DANH_MUC', 'NHOM_TAI_LIEU'] });
      queryClient.invalidateQueries({ queryKey: ['DANH_MUC', 'LOAI_TAI_LIEU'] });
      queryClient.invalidateQueries({ queryKey: ['HOSO_DETAIL'] });
    },
  });
};

export const useTinhTrangList = () => {
  return useQuery({
    queryKey: ['DANH_MUC', 'TINH_TRANG'],
    queryFn: () => danhMucService.getTinhTrang(),
  });
};

export const useNhomTaiLieuList = (options?: {
  includeInactive?: boolean;
  loaiHoSoId?: number;
  enabled?: boolean;
}) => {
  const includeInactive = Boolean(options?.includeInactive);
  const loaiHoSoId = options?.loaiHoSoId;
  return useQuery({
    queryKey: ['DANH_MUC', 'NHOM_TAI_LIEU', { includeInactive, loaiHoSoId: loaiHoSoId ?? null }],
    queryFn: () => danhMucService.getNhomTaiLieu({ includeInactive, loaiHoSoId }),
    enabled: options?.enabled ?? true,
  });
};

export const useCreateNhomTaiLieu = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: NhomTaiLieuPayload) => danhMucService.createNhomTaiLieu(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['DANH_MUC', 'NHOM_TAI_LIEU'] });
      queryClient.invalidateQueries({ queryKey: ['DANH_MUC', 'LOAI_TAI_LIEU'] });
    },
  });
};

export const useUpdateNhomTaiLieu = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: NhomTaiLieuPayload }) =>
      danhMucService.updateNhomTaiLieu(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['DANH_MUC', 'NHOM_TAI_LIEU'] });
      queryClient.invalidateQueries({ queryKey: ['DANH_MUC', 'LOAI_TAI_LIEU'] });
      queryClient.invalidateQueries({ queryKey: ['HOSO_DETAIL'] });
    },
  });
};

export const useDeleteNhomTaiLieu = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => danhMucService.deleteNhomTaiLieu(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['DANH_MUC', 'NHOM_TAI_LIEU'] });
      queryClient.invalidateQueries({ queryKey: ['DANH_MUC', 'LOAI_TAI_LIEU'] });
    },
  });
};

export const useLoaiTaiLieuList = (options?: {
  includeInactive?: boolean;
  loaiHoSoId?: number;
  enabled?: boolean;
}) => {
  const includeInactive = Boolean(options?.includeInactive);
  const loaiHoSoId = options?.loaiHoSoId;
  return useQuery({
    queryKey: ['DANH_MUC', 'LOAI_TAI_LIEU', { includeInactive, loaiHoSoId: loaiHoSoId ?? null }],
    queryFn: () => danhMucService.getLoaiTaiLieu({ includeInactive, loaiHoSoId }),
    enabled: options?.enabled ?? true,
  });
};

export const useCreateLoaiTaiLieu = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LoaiTaiLieuPayload) => danhMucService.createLoaiTaiLieu(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['DANH_MUC', 'LOAI_TAI_LIEU'] });
      queryClient.invalidateQueries({ queryKey: ['DANH_MUC', 'NHOM_TAI_LIEU'] });
    },
  });
};

export const useUpdateLoaiTaiLieu = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: LoaiTaiLieuPayload }) =>
      danhMucService.updateLoaiTaiLieu(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['DANH_MUC', 'LOAI_TAI_LIEU'] });
      queryClient.invalidateQueries({ queryKey: ['DANH_MUC', 'NHOM_TAI_LIEU'] });
      queryClient.invalidateQueries({ queryKey: ['HOSO_DETAIL'] });
    },
  });
};

export const useDeleteLoaiTaiLieu = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => danhMucService.deleteLoaiTaiLieu(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['DANH_MUC', 'LOAI_TAI_LIEU'] });
      queryClient.invalidateQueries({ queryKey: ['DANH_MUC', 'NHOM_TAI_LIEU'] });
    },
  });
};

export const useLoaiThayDoiList = () => {
  return useQuery({
    queryKey: ['DANH_MUC', 'LOAI_THAY_DOI'],
    queryFn: () => danhMucService.getLoaiThayDoi(),
  });
};
