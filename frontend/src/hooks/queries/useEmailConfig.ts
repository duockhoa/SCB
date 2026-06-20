import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/services/api';
import { message } from 'antd';

// SMTP Config Hooks
export const useSmtpConfig = () => {
  return useQuery({
    queryKey: ['smtpConfig'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/email-config/smtp');
      return data;
    },
  });
};

export const useUpdateSmtpConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await axiosInstance.post('/email-config/smtp', payload);
      return data;
    },
    onSuccess: () => {
      message.success('Lưu cấu hình SMTP thành công');
      queryClient.invalidateQueries({ queryKey: ['smtpConfig'] });
    },
    onError: (error: any) => {
      message.error(`Lỗi: ${error.response?.data?.message || error.message}`);
    },
  });
};

export const useTestSmtp = () => {
  return useMutation({
    mutationFn: async (testEmail: string) => {
      const { data } = await axiosInstance.post('/email-config/smtp/test', { test_email: testEmail });
      return data;
    },
    onSuccess: () => {
      message.success('Gửi email test thành công, vui lòng kiểm tra hộp thư');
    },
    onError: (error: any) => {
      message.error(`Lỗi gửi test: ${error.response?.data?.message || error.message}`);
    },
  });
};

// Recipient Config Hooks
export const useRecipients = () => {
  return useQuery({
    queryKey: ['recipients'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/email-config/recipients');
      return data;
    },
  });
};

export const useAddRecipient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await axiosInstance.post('/email-config/recipients', payload);
      return data;
    },
    onSuccess: () => {
      message.success('Thêm cấu hình nhận mail thành công');
      queryClient.invalidateQueries({ queryKey: ['recipients'] });
    },
    onError: (error: any) => {
      message.error(`Lỗi: ${error.response?.data?.message || error.message}`);
    },
  });
};

export const useUpdateRecipient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const { data } = await axiosInstance.put(`/email-config/recipients/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      message.success('Cập nhật cấu hình nhận mail thành công');
      queryClient.invalidateQueries({ queryKey: ['recipients'] });
    },
    onError: (error: any) => {
      message.error(`Lỗi: ${error.response?.data?.message || error.message}`);
    },
  });
};

export const useDeleteRecipient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await axiosInstance.delete(`/email-config/recipients/${id}`);
      return data;
    },
    onSuccess: () => {
      message.success('Xóa cấu hình nhận mail thành công');
      queryClient.invalidateQueries({ queryKey: ['recipients'] });
    },
    onError: (error: any) => {
      message.error(`Lỗi: ${error.response?.data?.message || error.message}`);
    },
  });
};
