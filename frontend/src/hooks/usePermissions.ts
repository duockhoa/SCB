import { useAuthStore } from '@/store/authStore';

const DEVELOPER_USERNAMES = (process.env.NEXT_PUBLIC_DEVELOPER_USERNAMES || 'lehoangcuong').split(',').map(s => s.trim().toLowerCase());

export const usePermissions = () => {
  const { user } = useAuthStore();

  if (!user) {
    return {
      canCreate: false,
      canUpdate: false,
      canDelete: false,
      canCapSo: false,
      canGiaHan: false,
      canThayThe: false,
      canThayDoi: false,
      canTaiLieu: false,
      canManage: false,
      canManageRoles: false,
      canManageUsers: false,
      canManageCompany: false,
      canConfigEmail: false,
      canViewSystemLogs: false,
      canViewDanhMuc: false,
      isDeveloper: false,
      isAdmin: false,
      isDangKy: false,
      isTruongPhong: false,
      isNhanVien: false,
      hasPermission: (_code: string) => false,
      userRole: null,
      userRoleName: null,
    };
  }

  const isDeveloper = DEVELOPER_USERNAMES.includes(user.username?.toLowerCase() || '');
  const isAdmin = isDeveloper || user.role === 'ADMIN' || user.vai_tro?.ma_vai_tro === 'ADMIN' || !!user.isAdmin;
  const permissions: string[] = user.permissions || [];
  
  // Kiểm tra quyền hạn trực tiếp theo cấu hình RBAC trên app
  const hasPermission = (code: string) => isAdmin || permissions.includes('*') || permissions.includes(code);

  const canCreate = hasPermission('HOSO_CREATE');
  const canUpdate = hasPermission('HOSO_UPDATE');
  const canDelete = hasPermission('HOSO_DELETE');
  const canCapSo = hasPermission('HOSO_CAP_SO');
  const canGiaHan = hasPermission('HOSO_GIA_HAN');
  const canThayThe = hasPermission('HOSO_THAY_THE');
  const canThayDoi = hasPermission('HOSO_THAY_DOI');
  const canTaiLieu = hasPermission('HOSO_TAI_LIEU');

  const canManageRoles = hasPermission('ROLES_MANAGE');
  const canManageUsers = hasPermission('USERS_MANAGE');
  const canManageCompany = hasPermission('CONG_TY_MANAGE');
  const canConfigEmail = hasPermission('EMAIL_CONFIG');
  const canViewSystemLogs = hasPermission('SYSTEM_LOGS');
  const canViewDanhMuc = hasPermission('DANH_MUC_VIEW') || hasPermission('DANH_MUC_MANAGE');

  return {
    canCreate,
    canUpdate,
    canDelete,
    canCapSo,
    canGiaHan,
    canThayThe,
    canThayDoi,
    canTaiLieu,
    canManage: isAdmin || canManageRoles || canManageUsers,
    canManageRoles,
    canManageUsers,
    canManageCompany,
    canConfigEmail,
    canViewSystemLogs,
    canViewDanhMuc,
    isDeveloper,
    isAdmin,
    // Thông tin hiển thị ngữ cảnh (không dùng để chặn quyền)
    isDangKy: (user.department || '').toLowerCase().includes('đăng ký'),
    isTruongPhong: (user.position || '').toLowerCase().includes('tp') || (user.position || '').toLowerCase().includes('trưởng phòng'),
    isNhanVien: (user.position || '').toLowerCase().includes('nv') || (user.position || '').toLowerCase().includes('nhân viên'),
    hasPermission,
    userRole: user.role || user.vai_tro?.ma_vai_tro || null,
    userRoleName: user.roleName || user.vai_tro?.ten_vai_tro || null,
  };
};
