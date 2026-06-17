import { axiosInstance } from './api';
import { ENDPOINTS } from '@/constants/endpoints';

export const hoSoService = {
  getAll: async (params?: any) => axiosInstance.get(ENDPOINTS.HO_SO, { params }),
  getById: async (id: number) => axiosInstance.get(`${ENDPOINTS.HO_SO}/${id}`),
  create: async (data: any) => axiosInstance.post(ENDPOINTS.HO_SO, data),
  update: async (id: number, data: any) => axiosInstance.patch(`${ENDPOINTS.HO_SO}/${id}`, data),
  delete: async (id: number) => axiosInstance.delete(`${ENDPOINTS.HO_SO}/${id}`),
  capSo: async (id: number, data: any) => axiosInstance.patch(`${ENDPOINTS.HO_SO}/${id}/cap-so`, data),
  giaHan: async (id: number, data: any) => axiosInstance.post(`${ENDPOINTS.HO_SO}/${id}/gia-han`, data),
  thayThe: async (id: number, data: any) => axiosInstance.post(`${ENDPOINTS.HO_SO}/${id}/thay-the`, data),
  thayDoi: async (id: number, data: any) => axiosInstance.post(`${ENDPOINTS.HO_SO}/${id}/thay-doi`, data),
  updateLichSuThayDoi: async (id: number, lichSuId: number, data: any) => axiosInstance.patch(`${ENDPOINTS.HO_SO}/${id}/lich-su-thay-doi/${lichSuId}`, data),
};
