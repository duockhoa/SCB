import { axiosInstance } from './api';
import type { CustomFieldConfig } from '@/types/ho-so.type';

export interface LoaiHoSoPayload {
  ma_loai?: string;
  ten_loai?: string;
  mo_ta?: string | null;
  mau_sac?: string | null;
  thu_tu?: number;
  trang_thai?: boolean;
  thoi_gian_canh_bao?: number;
  don_vi_canh_bao?: 'THANG' | 'NGAY' | string;
  cau_hinh_truong?: CustomFieldConfig[] | null;
}

export interface NhomTaiLieuPayload {
  ma_nhom?: string;
  ten_nhom?: string;
  mo_ta?: string | null;
  mau_sac?: string | null;
  thu_tu?: number;
  trang_thai?: boolean;
  ap_dung_tat_ca?: boolean;
  loai_ho_so_ids?: number[];
}

export interface LoaiTaiLieuPayload {
  nhom_tai_lieu_id?: number | null;
  ma_loai_tai_lieu?: string;
  ten_loai_tai_lieu?: string;
  mo_ta?: string | null;
  mau_sac?: string | null;
  thu_tu?: number;
  trang_thai?: boolean;
  ap_dung_tat_ca?: boolean;
  loai_ho_so_ids?: number[];
  cau_hinh_truong?: CustomFieldConfig[] | null;
}

export const danhMucService = {
  getLoaiHoSo: async (includeInactive = false) =>
    axiosInstance.get('/danh-muc/loai-ho-so', {
      params: includeInactive ? { includeInactive: 'true' } : undefined,
    }),
  createLoaiHoSo: async (data: LoaiHoSoPayload) =>
    axiosInstance.post('/danh-muc/loai-ho-so', data),
  updateLoaiHoSo: async (id: number, data: LoaiHoSoPayload) =>
    axiosInstance.put(`/danh-muc/loai-ho-so/${id}`, data),
  deleteLoaiHoSo: async (id: number) =>
    axiosInstance.delete(`/danh-muc/loai-ho-so/${id}`),
  updateLoaiHoSoExpiry: async (
    id: number,
    data: { thoi_gian_canh_bao: number; don_vi_canh_bao?: string; dong_bo_tat_ca?: boolean },
  ) => axiosInstance.patch(`/danh-muc/loai-ho-so/${id}/canh-bao-han`, data),
  updateLoaiHoSoTaiLieuConfig: async (
    id: number,
    data: { nhom_tai_lieu_ids: number[]; loai_tai_lieu_ids: number[] },
  ) => axiosInstance.put(`/danh-muc/loai-ho-so/${id}/tai-lieu-config`, data),
  getTinhTrang: async () => axiosInstance.get('/danh-muc/tinh-trang'),
  getNhomTaiLieu: async (params?: { includeInactive?: boolean; loaiHoSoId?: number }) =>
    axiosInstance.get('/danh-muc/nhom-tai-lieu', {
      params: {
        ...(params?.includeInactive ? { includeInactive: 'true' } : {}),
        ...(params?.loaiHoSoId ? { loaiHoSoId: params.loaiHoSoId } : {}),
      },
    }),
  createNhomTaiLieu: async (data: NhomTaiLieuPayload) =>
    axiosInstance.post('/danh-muc/nhom-tai-lieu', data),
  updateNhomTaiLieu: async (id: number, data: NhomTaiLieuPayload) =>
    axiosInstance.put(`/danh-muc/nhom-tai-lieu/${id}`, data),
  deleteNhomTaiLieu: async (id: number) =>
    axiosInstance.delete(`/danh-muc/nhom-tai-lieu/${id}`),
  getLoaiTaiLieu: async (params?: { includeInactive?: boolean; loaiHoSoId?: number }) =>
    axiosInstance.get('/danh-muc/loai-tai-lieu', {
      params: {
        ...(params?.includeInactive ? { includeInactive: 'true' } : {}),
        ...(params?.loaiHoSoId ? { loaiHoSoId: params.loaiHoSoId } : {}),
      },
    }),
  createLoaiTaiLieu: async (data: LoaiTaiLieuPayload) =>
    axiosInstance.post('/danh-muc/loai-tai-lieu', data),
  updateLoaiTaiLieu: async (id: number, data: LoaiTaiLieuPayload) =>
    axiosInstance.put(`/danh-muc/loai-tai-lieu/${id}`, data),
  deleteLoaiTaiLieu: async (id: number) =>
    axiosInstance.delete(`/danh-muc/loai-tai-lieu/${id}`),
  getLoaiThayDoi: async () => axiosInstance.get('/danh-muc/loai-thay-doi'),
};
