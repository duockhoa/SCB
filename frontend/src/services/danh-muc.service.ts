import { axiosInstance } from './api';

export const danhMucService = {
  getLoaiHoSo: async () => axiosInstance.get('/danh-muc/loai-ho-so'),
  getTinhTrang: async () => axiosInstance.get('/danh-muc/tinh-trang'),
  getLoaiTaiLieu: async () => axiosInstance.get('/danh-muc/loai-tai-lieu'),
  getLoaiThayDoi: async () => axiosInstance.get('/danh-muc/loai-thay-doi'),
};
