import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hoSoService } from '@/services/ho-so.service';

export const useHoSoList = (filters?: any) => {
  return useQuery({
    queryKey: ['HOSO_LIST', filters],
    queryFn: () => hoSoService.getAll(filters),
  });
};

export const useHoSoDetail = (id: number) => {
  return useQuery({
    queryKey: ['HOSO_DETAIL', id],
    queryFn: () => hoSoService.getById(id),
    enabled: !!id,
  });
};

export const useCreateHoSo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => hoSoService.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['HOSO_LIST'] }),
  });
};

export const useUpdateHoSo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => hoSoService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['HOSO_LIST'] }),
  });
};

export const useDeleteHoSo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => hoSoService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['HOSO_LIST'] }),
  });
};

export const useCapSo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => hoSoService.capSo(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['HOSO_LIST'] }),
  });
};

export const useGiaHan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => hoSoService.giaHan(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['HOSO_LIST'] }),
  });
};

export const useThayThe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => hoSoService.thayThe(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['HOSO_LIST'] }),
  });
};

export const useThayDoi = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => hoSoService.thayDoi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['HOSO_LIST'] });
      queryClient.invalidateQueries({ queryKey: ['HOSO_DETAIL'] });
    },
  });
};

export const useUpdateLichSuThayDoi = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, lichSuId, data }: { id: number; lichSuId: number; data: any }) => hoSoService.updateLichSuThayDoi(id, lichSuId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['HOSO_DETAIL'] });
    },
  });
};
