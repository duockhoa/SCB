import { axiosInstance } from './api';
import { ENDPOINTS } from '@/constants/endpoints';

export interface TaiLieuPayload {
  ten_tai_lieu: string;
  duong_dan_url: string;
  loai_tai_lieu_id?: number;
  ngay_hieu_luc?: string;
  ngay_het_hieu_luc?: string;
  ghi_chu?: string;
  du_lieu_dac_thu?: Record<string, unknown>;
}

export interface UpdateTaiLieuPayload {
  ten_tai_lieu?: string;
  duong_dan_url?: string;
  loai_tai_lieu_id?: number;
  ngay_hieu_luc?: string | null;
  ngay_het_hieu_luc?: string | null;
  ghi_chu?: string | null;
  du_lieu_dac_thu?: Record<string, unknown> | null;
}

export interface ReplaceTaiLieuPayload {
  duong_dan_url: string;
  ten_tai_lieu?: string;
  loai_tai_lieu_id?: number;
  ngay_hieu_luc?: string | null;
  ngay_het_hieu_luc?: string | null;
  ghi_chu?: string | null;
  du_lieu_dac_thu?: Record<string, unknown> | null;
}

export const hoSoService = {
  getAll: async (params?: any) => axiosInstance.get(ENDPOINTS.HO_SO, { params }),
  getDashboard: async (params?: any) => axiosInstance.get(`${ENDPOINTS.HO_SO}/dashboard`, { params }),
  getById: async (id: number) => axiosInstance.get(`${ENDPOINTS.HO_SO}/${id}`),
  create: async (data: any) => axiosInstance.post(ENDPOINTS.HO_SO, data),
  update: async (id: number, data: any) => axiosInstance.put(`${ENDPOINTS.HO_SO}/${id}`, data),
  delete: async (id: number) => axiosInstance.delete(`${ENDPOINTS.HO_SO}/${id}`),
  capSo: async (id: number, data: any) => axiosInstance.patch(`${ENDPOINTS.HO_SO}/${id}/cap-so`, data),
  giaHan: async (id: number, data: any) => axiosInstance.post(`${ENDPOINTS.HO_SO}/${id}/gia-han`, data),
  apDungQuyDinh: async (id: number, data: any) => axiosInstance.patch(`${ENDPOINTS.HO_SO}/${id}/quy-dinh-tam-thoi`, data),
  thayThe: async (id: number, data: any) => axiosInstance.post(`${ENDPOINTS.HO_SO}/${id}/thay-the`, data),
  thayDoi: async (id: number, data: any) => axiosInstance.post(`${ENDPOINTS.HO_SO}/${id}/thay-doi`, data),
  updateLichSuThayDoi: async (id: number, lichSuId: number, data: any) => axiosInstance.patch(`${ENDPOINTS.HO_SO}/${id}/lich-su-thay-doi/${lichSuId}`, data),
  deleteLichSuThayDoi: async (id: number, lichSuId: number) => axiosInstance.delete(`${ENDPOINTS.HO_SO}/${id}/lich-su-thay-doi/${lichSuId}`),
  addTaiLieu: async (id: number, data: TaiLieuPayload) => axiosInstance.post(`${ENDPOINTS.HO_SO}/${id}/tai-lieu`, data),
  updateTaiLieu: async (id: number, taiLieuId: number, data: UpdateTaiLieuPayload) => axiosInstance.patch(`${ENDPOINTS.HO_SO}/${id}/tai-lieu/${taiLieuId}`, data),
  replaceTaiLieu: async (id: number, taiLieuId: number, data: ReplaceTaiLieuPayload) => axiosInstance.post(`${ENDPOINTS.HO_SO}/${id}/tai-lieu/${taiLieuId}/thay-the`, data),
  deleteTaiLieu: async (id: number, taiLieuId: number) => axiosInstance.delete(`${ENDPOINTS.HO_SO}/${id}/tai-lieu/${taiLieuId}`),
};
