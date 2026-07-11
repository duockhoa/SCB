import { useAuthStore } from '@/store/authStore';

const DEVELOPER_USERNAMES = (process.env.NEXT_PUBLIC_DEVELOPER_USERNAMES || 'lehoangcuong').split(',').map(s => s.trim().toLowerCase());

export const usePermissions = () => {
  const { user } = useAuthStore();

  if (!user) {
    return {
      canCreate: false,
      canUpdate: false,
      canDelete: false,
      canManage: false,
      canConfigEmail: false,
      canViewSystemLogs: false,
      canViewDanhMuc: false,
      canApproveFile: false,
      isDeveloper: false,
      isDangKy: false,
      isTruongPhong: false,
      isNhanVien: false,
    };
  }

  const isDeveloper = DEVELOPER_USERNAMES.includes(user.username?.toLowerCase() || '');
  const isDangKy = user.department
    ? user.department.toString().trim().normalize('NFC').toLowerCase() === (process.env.NEXT_PUBLIC_DEPT_REGISTRATION || 'Đăng ký').toString().trim().normalize('NFC').toLowerCase()
    : false;
  const isTruongPhong = user.position
    ? user.position.toString().trim().normalize('NFC').toLowerCase() === (process.env.NEXT_PUBLIC_ROLE_MANAGER || 'TP').toString().trim().normalize('NFC').toLowerCase()
    : false;
  const isNhanVien = user.position
    ? user.position.toString().trim().normalize('NFC').toLowerCase() === (process.env.NEXT_PUBLIC_ROLE_STAFF || 'NV').toString().trim().normalize('NFC').toLowerCase()
    : false;

  const canCreateUpdate = isDeveloper || isDangKy;
  const canDeleteManage = isDeveloper || (isDangKy && isTruongPhong);

  return {
    canCreate: canCreateUpdate,
    canUpdate: canCreateUpdate,
    canDelete: canDeleteManage,
    canManage: canDeleteManage,
    canConfigEmail: canDeleteManage,
    canViewSystemLogs: canDeleteManage,
    canViewDanhMuc: canDeleteManage,
    canApproveFile: canDeleteManage,
    isDeveloper,
    isDangKy,
    isTruongPhong,
    isNhanVien,
  };
};
