import { axiosInstance } from './api';
import { ENDPOINTS } from '@/constants/endpoints';

export const congTyService = {
  getAll: async (params?: any) => axiosInstance.get(ENDPOINTS.CONG_TY, { params }),
  getById: async (id: number) => axiosInstance.get(`${ENDPOINTS.CONG_TY}/${id}`),
  create: async (data: any) => axiosInstance.post(ENDPOINTS.CONG_TY, data),
  update: async (id: number, data: any) => axiosInstance.patch(`${ENDPOINTS.CONG_TY}/${id}`, data),
  delete: async (id: number) => axiosInstance.delete(`${ENDPOINTS.CONG_TY}/${id}`),
};
