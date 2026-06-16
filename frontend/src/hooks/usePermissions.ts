import { useAuthStore } from '@/store/authStore';

export const usePermissions = () => {
  const { user } = useAuthStore();

  if (!user) {
    return {
      canCreate: false,
      canUpdate: false, // Cấp số, gia hạn, thêm thay đổi
      canManage: false, // Sửa, Xóa, Thay thế (chỉ Trưởng phòng)
    };
  }

  const isDangKy = user.department === 'Đăng ký';
  const isTruongPhong = user.position === 'PT';

  return {
    canCreate: isDangKy,
    canUpdate: isDangKy,
    canManage: isDangKy && isTruongPhong,
  };
};
