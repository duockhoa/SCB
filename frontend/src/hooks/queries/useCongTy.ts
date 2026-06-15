import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { congTyService } from '@/services/cong-ty.service';

export const useCongTyList = (filters?: any) => {
  return useQuery({
    queryKey: ['CONGTY_LIST', filters],
    queryFn: () => congTyService.getAll(filters),
  });
};

export const useCongTyDetail = (id: number) => {
  return useQuery({
    queryKey: ['CONGTY_DETAIL', id],
    queryFn: () => congTyService.getById(id),
    enabled: !!id,
  });
};

export const useCreateCongTy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => congTyService.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['CONGTY_LIST'] }),
  });
};

export const useUpdateCongTy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => congTyService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['CONGTY_LIST'] }),
  });
};

export const useDeleteCongTy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => congTyService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['CONGTY_LIST'] }),
  });
};
