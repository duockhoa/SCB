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

  // Đặc quyền cứng cho anh Lê Hoàng Cương (Full quyền Trưởng phòng)
  const isLeHoangCuong = user.name?.toLowerCase().includes('lê hoàng cương') || 
                         user.name?.toLowerCase().includes('le hoang cuong') ||
                         user.username?.toLowerCase().includes('lehoangcuong');

  const isDangKy = user.department === 'Đăng ký' || isLeHoangCuong;
  const isTruongPhong = user.position === 'PT' || isLeHoangCuong;

  return {
    canCreate: isDangKy,
    canUpdate: isDangKy,
    canManage: isDangKy && isTruongPhong,
    canConfigEmail: isTruongPhong,
  };
};
