import { useAuthStore } from '@/store/authStore';

const DEVELOPER_USERNAMES = (process.env.NEXT_PUBLIC_DEVELOPER_USERNAMES || 'lehoangcuong').split(',').map(s => s.trim().toLowerCase());

export const usePermissions = () => {
  const { user } = useAuthStore();

  if (!user) {
    return {
      // Hồ sơ
      canView: false,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
      canCapSo: false,
      canGiaHan: false,
      canThayThe: false,
      canExport: false,
      // Lịch sử thay đổi
      canThayDoiView: false,
      canThayDoiCreate: false,
      canThayDoiUpdate: false,
      canThayDoiDelete: false,
      canThayDoi: false,
      // Tài liệu
      canTaiLieuView: false,
      canTaiLieuUpload: false,
      canTaiLieuReplace: false,
      canTaiLieuDelete: false,
      canTaiLieu: false,
      // Công ty
      canCongTyView: false,
      canCongTyCreate: false,
      canCongTyUpdate: false,
      canCongTyDelete: false,
      canManageCompany: false,
      // Danh mục
      canDanhMucView: false,
      canDanhMucCreate: false,
      canDanhMucUpdate: false,
      canDanhMucDelete: false,
      canViewDanhMuc: false,
      // Người dùng
      canUsersView: false,
      canUsersSync: false,
      canUsersAssignRole: false,
      canUsersCustomPerm: false,
      canManageUsers: false,
      // Nhóm quyền RBAC
      canRolesView: false,
      canRolesCreate: false,
      canRolesUpdate: false,
      canRolesDelete: false,
      canManageRoles: false,
      // Email
      canEmailView: false,
      canEmailUpdate: false,
      canEmailTest: false,
      canConfigEmail: false,
      // Logs
      canLogsView: false,
      canLogsExport: false,
      canViewSystemLogs: false,
      // Chung
      canManage: false,
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

  // 1. Phân hệ Hồ sơ
  const canView = hasPermission('HOSO_VIEW');
  const canCreate = hasPermission('HOSO_CREATE');
  const canUpdate = hasPermission('HOSO_UPDATE');
  const canDelete = hasPermission('HOSO_DELETE');
  const canCapSo = hasPermission('HOSO_CAP_SO');
  const canGiaHan = hasPermission('HOSO_GIA_HAN');
  const canThayThe = hasPermission('HOSO_THAY_THE');
  const canExport = hasPermission('HOSO_EXPORT');

  // 2. Phân hệ Lịch sử thay đổi
  const canThayDoiView = hasPermission('HOSO_THAY_DOI_VIEW') || hasPermission('HOSO_THAY_DOI');
  const canThayDoiCreate = hasPermission('HOSO_THAY_DOI_CREATE') || hasPermission('HOSO_THAY_DOI');
  const canThayDoiUpdate = hasPermission('HOSO_THAY_DOI_UPDATE') || hasPermission('HOSO_THAY_DOI');
  const canThayDoiDelete = hasPermission('HOSO_THAY_DOI_DELETE') || hasPermission('HOSO_THAY_DOI');
  const canThayDoi = canThayDoiCreate;

  // 3. Phân hệ Tài liệu đính kèm & phiên bản
  const canTaiLieuView = hasPermission('HOSO_TAI_LIEU_VIEW') || hasPermission('HOSO_TAI_LIEU');
  const canTaiLieuUpload = hasPermission('HOSO_TAI_LIEU_UPLOAD') || hasPermission('HOSO_TAI_LIEU');
  const canTaiLieuReplace = hasPermission('HOSO_TAI_LIEU_REPLACE') || hasPermission('HOSO_TAI_LIEU');
  const canTaiLieuDelete = hasPermission('HOSO_TAI_LIEU_DELETE') || hasPermission('HOSO_TAI_LIEU');
  const canTaiLieu = canTaiLieuUpload || canTaiLieuReplace;

  // 4. Phân hệ Quản lý Công ty
  const canCongTyView = hasPermission('CONG_TY_VIEW') || hasPermission('CONG_TY_MANAGE');
  const canCongTyCreate = hasPermission('CONG_TY_CREATE') || hasPermission('CONG_TY_MANAGE');
  const canCongTyUpdate = hasPermission('CONG_TY_UPDATE') || hasPermission('CONG_TY_MANAGE');
  const canCongTyDelete = hasPermission('CONG_TY_DELETE') || hasPermission('CONG_TY_MANAGE');
  const canManageCompany = canCongTyCreate || canCongTyUpdate || canCongTyDelete;

  // 5. Phân hệ Danh mục Cơ sở
  const canDanhMucView = hasPermission('DANH_MUC_VIEW') || hasPermission('DANH_MUC_MANAGE');
  const canDanhMucCreate = hasPermission('DANH_MUC_CREATE') || hasPermission('DANH_MUC_MANAGE');
  const canDanhMucUpdate = hasPermission('DANH_MUC_UPDATE') || hasPermission('DANH_MUC_MANAGE');
  const canDanhMucDelete = hasPermission('DANH_MUC_DELETE') || hasPermission('DANH_MUC_MANAGE');
  const canViewDanhMuc = canDanhMucView || canDanhMucCreate || canDanhMucUpdate || canDanhMucDelete;

  // 6. Phân hệ Người dùng & Nhân sự
  const canUsersView = hasPermission('USERS_VIEW') || hasPermission('USERS_MANAGE');
  const canUsersSync = hasPermission('USERS_SYNC') || hasPermission('USERS_MANAGE');
  const canUsersAssignRole = hasPermission('USERS_ASSIGN_ROLE') || hasPermission('USERS_MANAGE');
  const canUsersCustomPerm = hasPermission('USERS_CUSTOM_PERM') || hasPermission('USERS_MANAGE');
  const canManageUsers = canUsersView || canUsersSync || canUsersAssignRole || canUsersCustomPerm;

  // 7. Phân hệ Nhóm quyền (RBAC)
  const canRolesView = hasPermission('ROLES_VIEW') || hasPermission('ROLES_MANAGE');
  const canRolesCreate = hasPermission('ROLES_CREATE') || hasPermission('ROLES_MANAGE');
  const canRolesUpdate = hasPermission('ROLES_UPDATE') || hasPermission('ROLES_MANAGE');
  const canRolesDelete = hasPermission('ROLES_DELETE') || hasPermission('ROLES_MANAGE');
  const canManageRoles = canRolesView || canRolesCreate || canRolesUpdate || canRolesDelete;

  // 8. Phân hệ Cấu hình Email
  const canEmailView = hasPermission('EMAIL_VIEW') || hasPermission('EMAIL_CONFIG');
  const canEmailUpdate = hasPermission('EMAIL_UPDATE') || hasPermission('EMAIL_CONFIG');
  const canEmailTest = hasPermission('EMAIL_TEST') || hasPermission('EMAIL_CONFIG');
  const canConfigEmail = canEmailView || canEmailUpdate || canEmailTest;

  // 9. Phân hệ Nhật ký Hệ thống
  const canLogsView = hasPermission('SYSTEM_LOGS_VIEW') || hasPermission('SYSTEM_LOGS');
  const canLogsExport = hasPermission('SYSTEM_LOGS_EXPORT') || hasPermission('SYSTEM_LOGS');
  const canViewSystemLogs = canLogsView || canLogsExport;

  return {
    // Hồ sơ
    canView,
    canCreate,
    canUpdate,
    canDelete,
    canCapSo,
    canGiaHan,
    canThayThe,
    canExport,
    // Thay đổi
    canThayDoiView,
    canThayDoiCreate,
    canThayDoiUpdate,
    canThayDoiDelete,
    canThayDoi,
    // Tài liệu
    canTaiLieuView,
    canTaiLieuUpload,
    canTaiLieuReplace,
    canTaiLieuDelete,
    canTaiLieu,
    // Công ty
    canCongTyView,
    canCongTyCreate,
    canCongTyUpdate,
    canCongTyDelete,
    canManageCompany,
    // Danh mục
    canDanhMucView,
    canDanhMucCreate,
    canDanhMucUpdate,
    canDanhMucDelete,
    canViewDanhMuc,
    // Người dùng
    canUsersView,
    canUsersSync,
    canUsersAssignRole,
    canUsersCustomPerm,
    canManageUsers,
    // Vai trò
    canRolesView,
    canRolesCreate,
    canRolesUpdate,
    canRolesDelete,
    canManageRoles,
    // Email
    canEmailView,
    canEmailUpdate,
    canEmailTest,
    canConfigEmail,
    // Logs
    canLogsView,
    canLogsExport,
    canViewSystemLogs,
    // Chung
    canManage: isAdmin || canManageRoles || canManageUsers,
    isDeveloper,
    isAdmin,
    // Thông tin hiển thị ngữ cảnh
    isDangKy: (user.department || '').toLowerCase().includes('đăng ký'),
    isTruongPhong: (user.position || '').toLowerCase().includes('tp') || (user.position || '').toLowerCase().includes('trưởng phòng'),
    isNhanVien: (user.position || '').toLowerCase().includes('nv') || (user.position || '').toLowerCase().includes('nhân viên'),
    hasPermission,
    userRole: user.role || user.vai_tro?.ma_vai_tro || null,
    userRoleName: user.roleName || user.vai_tro?.ten_vai_tro || null,
  };
};
