export interface PermissionItem {
  code: string;
  name: string;
  description: string;
  isDangerous?: boolean;
}

export interface PermissionModule {
  module: string;
  description: string;
  permissions: PermissionItem[];
}

export const PERMISSION_MODULES: PermissionModule[] = [
  {
    module: 'Hồ sơ Công bố',
    description: 'Thao tác với thông tin hồ sơ sản phẩm (Thuốc, Mỹ phẩm, TBYT, TPBVSK, CFS)',
    permissions: [
      { code: 'HOSO_VIEW', name: 'Xem danh sách & chi tiết', description: 'Tra cứu danh sách và xem đầy đủ thông tin hồ sơ' },
      { code: 'HOSO_CREATE', name: 'Tạo mới hồ sơ', description: 'Tạo hồ sơ thuốc, mỹ phẩm, TBYT, TPBVSK, CFS' },
      { code: 'HOSO_UPDATE', name: 'Cập nhật hồ sơ', description: 'Chỉnh sửa thông tin chung và dữ liệu đặc thù của hồ sơ' },
      { code: 'HOSO_DELETE', name: 'Xóa hồ sơ', description: 'Xóa hoàn toàn hồ sơ khỏi hệ thống', isDangerous: true },
      { code: 'HOSO_CAP_SO', name: 'Cấp số công bố', description: 'Ghi nhận số công bố / số đăng ký chính thức' },
      { code: 'HOSO_GIA_HAN', name: 'Gia hạn hồ sơ', description: 'Cập nhật gia hạn hạn dùng và thời hạn hiệu lực hồ sơ' },
      { code: 'HOSO_THAY_THE', name: 'Thay thế hồ sơ', description: 'Đổi số công bố và liên kết hồ sơ thay thế' },
      { code: 'HOSO_EXPORT', name: 'Xuất dữ liệu Excel', description: 'Xuất danh sách hồ sơ ra file bảng tính Excel' },
    ],
  },
  {
    module: 'Lịch sử Thay đổi hồ sơ',
    description: 'Quản lý các đợt thay đổi, bổ sung thông tin hồ sơ theo dòng thời gian',
    permissions: [
      { code: 'HOSO_THAY_DOI_VIEW', name: 'Xem lịch sử thay đổi', description: 'Xem danh sách các đợt thay đổi, bổ sung của hồ sơ' },
      { code: 'HOSO_THAY_DOI_CREATE', name: 'Thêm đợt thay đổi', description: 'Ghi nhận đợt thay đổi nội dung, nhãn, địa chỉ, công văn' },
      { code: 'HOSO_THAY_DOI_UPDATE', name: 'Sửa đợt thay đổi', description: 'Cập nhật nội dung, trạng thái duyệt và ngày phê duyệt thay đổi' },
      { code: 'HOSO_THAY_DOI_DELETE', name: 'Xóa đợt thay đổi', description: 'Xóa bản ghi đợt thay đổi khỏi lịch sử hồ sơ', isDangerous: true },
    ],
  },
  {
    module: 'Tài liệu Đính kèm & Phiên bản',
    description: 'Quản lý tài liệu đính kèm, tải lên thay thế và kiểm soát phiên bản (v1, v2...)',
    permissions: [
      { code: 'HOSO_TAI_LIEU_VIEW', name: 'Xem & tải tài liệu', description: 'Mở xem và tải file tài liệu đính kèm của hồ sơ' },
      { code: 'HOSO_TAI_LIEU_UPLOAD', name: 'Tải lên tài liệu mới', description: 'Thêm mới các file tài liệu đính kèm vào hồ sơ' },
      { code: 'HOSO_TAI_LIEU_REPLACE', name: 'Upload thay thế phiên bản', description: 'Upload file thay thế, tự động tăng số phiên bản và lưu vết bản cũ' },
      { code: 'HOSO_TAI_LIEU_DELETE', name: 'Xóa tài liệu đính kèm', description: 'Xóa file tài liệu đính kèm khỏi hồ sơ', isDangerous: true },
    ],
  },
  {
    module: 'Quản lý Công ty',
    description: 'Quản lý danh mục công ty sở hữu, đứng tên công bố và nhà phân phối',
    permissions: [
      { code: 'CONG_TY_VIEW', name: 'Xem danh sách công ty', description: 'Tra cứu danh sách và chi tiết thông tin các công ty' },
      { code: 'CONG_TY_CREATE', name: 'Thêm mới công ty', description: 'Thêm pháp nhân công ty mới vào hệ thống' },
      { code: 'CONG_TY_UPDATE', name: 'Cập nhật công ty', description: 'Chỉnh sửa tên, mã số thuế, địa chỉ pháp lý của công ty' },
      { code: 'CONG_TY_DELETE', name: 'Xóa công ty', description: 'Xóa công ty khỏi hệ thống', isDangerous: true },
    ],
  },
  {
    module: 'Danh mục Cơ sở & Tham số',
    description: 'Quản lý các danh mục phân loại loại hồ sơ, tình trạng, loại tài liệu, loại thay đổi',
    permissions: [
      { code: 'DANH_MUC_VIEW', name: 'Xem danh mục hệ thống', description: 'Xem danh mục loại hồ sơ, tình trạng, loại tài liệu, loại thay đổi' },
      { code: 'DANH_MUC_CREATE', name: 'Thêm mục danh mục', description: 'Thêm mới tham số phân loại danh mục' },
      { code: 'DANH_MUC_UPDATE', name: 'Cập nhật danh mục', description: 'Chỉnh sửa tên, mã hiển thị, màu sắc trạng thái' },
      { code: 'DANH_MUC_DELETE', name: 'Xóa mục danh mục', description: 'Xóa tham số danh mục khỏi hệ thống', isDangerous: true },
    ],
  },
  {
    module: 'Người dùng & Nhân sự',
    description: 'Quản lý người dùng, đồng bộ nhân sự HRM và cấp quyền riêng biệt',
    permissions: [
      { code: 'USERS_VIEW', name: 'Xem danh sách người dùng', description: 'Tra cứu danh sách nhân sự và tài khoản hệ thống' },
      { code: 'USERS_SYNC', name: 'Đồng bộ nhân sự HRM', description: 'Thực hiện đồng bộ dữ liệu nhân sự tự động từ hệ thống HRM' },
      { code: 'USERS_ASSIGN_ROLE', name: 'Gán vai trò người dùng', description: 'Gán hoặc thay đổi nhóm vai trò RBAC cho nhân sự' },
      { code: 'USERS_CUSTOM_PERM', name: 'Cấp quyền riêng nhân sự', description: 'Cấp hoặc thu hồi các quyền ngoại lệ riêng biệt cho từng cá nhân', isDangerous: true },
    ],
  },
  {
    module: 'Quản lý Nhóm quyền (RBAC)',
    description: 'Thiết lập danh sách vai trò và cấu hình ma trận phân quyền',
    permissions: [
      { code: 'ROLES_VIEW', name: 'Xem danh sách vai trò', description: 'Xem bảng phân quyền và danh sách các nhóm vai trò' },
      { code: 'ROLES_CREATE', name: 'Tạo mới vai trò', description: 'Thêm nhóm vai trò mới vào hệ thống' },
      { code: 'ROLES_UPDATE', name: 'Cập nhật vai trò & quyền', description: 'Chỉnh sửa thông tin vai trò và ma trận quyền hạn' },
      { code: 'ROLES_DELETE', name: 'Xóa vai trò', description: 'Xóa nhóm vai trò khỏi hệ thống', isDangerous: true },
    ],
  },
  {
    module: 'Cấu hình Email & Thông báo',
    description: 'Cài đặt máy chủ SMTP và danh sách email nhận cảnh báo hạn hồ sơ',
    permissions: [
      { code: 'EMAIL_VIEW', name: 'Xem cấu hình Email', description: 'Xem thông số máy chủ gửi mail và danh sách người nhận cảnh báo' },
      { code: 'EMAIL_UPDATE', name: 'Cập nhật cấu hình Email', description: 'Lưu thiết lập SMTP và chỉnh sửa danh sách nhận mail cảnh báo' },
      { code: 'EMAIL_TEST', name: 'Gửi email thử nghiệm', description: 'Gửi email test kiểm tra kết nối máy chủ mail' },
    ],
  },
  {
    module: 'Nhật ký Hệ thống & Kiểm toán',
    description: 'Theo dõi lịch sử thao tác người dùng, kiểm toán an toàn dữ liệu',
    permissions: [
      { code: 'SYSTEM_LOGS_VIEW', name: 'Xem nhật ký kiểm toán', description: 'Xem lịch sử thao tác API, đăng nhập và nhật ký kiểm toán' },
      { code: 'SYSTEM_LOGS_EXPORT', name: 'Xuất file nhật ký', description: 'Xuất file báo cáo nhật ký kiểm toán hệ thống' },
    ],
  },
];

export const ALL_PERMISSION_CODES = PERMISSION_MODULES.flatMap((m) =>
  m.permissions.map((p) => p.code),
);

export type TaiLieuAction = 'VIEW' | 'UPLOAD' | 'REPLACE' | 'DELETE';

export const TAI_LIEU_GROUP_PREFIX = 'HOSO_TAI_LIEU_GROUP:';

export function buildTaiLieuGroupPermissionCode(maLoaiTaiLieu: string, action: TaiLieuAction): string {
  return `${TAI_LIEU_GROUP_PREFIX}${maLoaiTaiLieu.trim().toUpperCase()}:${action}`;
}

export function buildTaiLieuGroupPermissions(
  groups: Array<{ ma_loai_tai_lieu: string; ten_loai_tai_lieu: string }>,
): PermissionModule[] {
  if (!groups || groups.length === 0) return [];

  const permissions: PermissionItem[] = [];
  for (const group of groups) {
    const code = group.ma_loai_tai_lieu.trim().toUpperCase();
    const label = group.ten_loai_tai_lieu.trim();
    permissions.push(
      {
        code: buildTaiLieuGroupPermissionCode(code, 'VIEW'),
        name: `[${label}] Xem & tải tài liệu`,
        description: `Xem và tải các tài liệu thuộc nhóm "${label}" (${code})`,
      },
      {
        code: buildTaiLieuGroupPermissionCode(code, 'UPLOAD'),
        name: `[${label}] Tải lên & sửa tài liệu`,
        description: `Thêm mới và chỉnh sửa tài liệu thuộc nhóm "${label}" (${code})`,
      },
      {
        code: buildTaiLieuGroupPermissionCode(code, 'REPLACE'),
        name: `[${label}] Thay thế phiên bản`,
        description: `Upload thay thế phiên bản mới cho tài liệu thuộc nhóm "${label}" (${code})`,
      },
      {
        code: buildTaiLieuGroupPermissionCode(code, 'DELETE'),
        name: `[${label}] Xóa tài liệu`,
        description: `Xóa tài liệu thuộc nhóm "${label}" (${code})`,
        isDangerous: true,
      },
    );
  }

  return [
    {
      module: 'Phân quyền theo Nhóm Tài liệu Tải lên',
      description:
        'Phân quyền chi tiết theo từng nhóm loại tài liệu (nếu không bật quyền Tài liệu tổng quát ở trên, vai trò/nhân sự chỉ thao tác được các nhóm được chọn dưới đây)',
      permissions,
    },
  ];
}

export interface AuthUserContext {
  userId?: number;
  username?: string;
  role?: string | null;
  isAdmin?: boolean;
  permissions?: string[];
}

export function isAdminOrWildcardUser(user?: AuthUserContext | null): boolean {
  if (!user) return false;
  const developerUsernames = (process.env.DEVELOPER_USERNAMES || 'lehoangcuong')
    .split(',')
    .map((s) => s.trim().toLowerCase());
  const isDevOrAdmin =
    developerUsernames.includes(user.username?.toLowerCase() || '') ||
    user.role === 'ADMIN' ||
    !!user.isAdmin;
  if (isDevOrAdmin) return true;
  return Array.isArray(user.permissions) && user.permissions.includes('*');
}

export function hasAnyTaiLieuGroupAction(userPerms: string[], action: TaiLieuAction): boolean {
  if (!userPerms || userPerms.length === 0) return false;
  if (action === 'VIEW') {
    return userPerms.some(
      (p) =>
        p.startsWith(TAI_LIEU_GROUP_PREFIX) &&
        (p.endsWith(':VIEW') || p.endsWith(':UPLOAD') || p.endsWith(':REPLACE') || p.endsWith(':DELETE')),
    );
  }
  return userPerms.some((p) => p.startsWith(TAI_LIEU_GROUP_PREFIX) && p.endsWith(`:${action}`));
}

export function hasRoutePermissionMatch(userPerms: string[], requiredPerm: string): boolean {
  if (userPerms.includes(requiredPerm)) return true;
  if (requiredPerm === 'HOSO_TAI_LIEU_VIEW') return hasAnyTaiLieuGroupAction(userPerms, 'VIEW');
  if (requiredPerm === 'HOSO_TAI_LIEU_UPLOAD') return hasAnyTaiLieuGroupAction(userPerms, 'UPLOAD');
  if (requiredPerm === 'HOSO_TAI_LIEU_REPLACE') return hasAnyTaiLieuGroupAction(userPerms, 'REPLACE');
  if (requiredPerm === 'HOSO_TAI_LIEU_DELETE') return hasAnyTaiLieuGroupAction(userPerms, 'DELETE');
  return false;
}

export function hasTaiLieuGroupPermission(
  user: AuthUserContext | null | undefined,
  maLoaiTaiLieu: string | null | undefined,
  action: TaiLieuAction,
): boolean {
  if (!user) return false;
  if (isAdminOrWildcardUser(user)) return true;

  const perms = Array.isArray(user.permissions) ? user.permissions : [];
  if (perms.includes('HOSO_TAI_LIEU')) return true;

  if (action === 'VIEW') {
    if (
      perms.includes('HOSO_TAI_LIEU_VIEW') ||
      perms.includes('HOSO_TAI_LIEU_UPLOAD') ||
      perms.includes('HOSO_TAI_LIEU_REPLACE') ||
      perms.includes('HOSO_TAI_LIEU_DELETE')
    ) {
      return true;
    }
    if (!maLoaiTaiLieu) return false;
    const code = maLoaiTaiLieu.trim().toUpperCase();
    return (
      perms.includes(buildTaiLieuGroupPermissionCode(code, 'VIEW')) ||
      perms.includes(buildTaiLieuGroupPermissionCode(code, 'UPLOAD')) ||
      perms.includes(buildTaiLieuGroupPermissionCode(code, 'REPLACE')) ||
      perms.includes(buildTaiLieuGroupPermissionCode(code, 'DELETE'))
    );
  }

  if (action === 'UPLOAD' && perms.includes('HOSO_TAI_LIEU_UPLOAD')) return true;
  if (action === 'REPLACE' && perms.includes('HOSO_TAI_LIEU_REPLACE')) return true;
  if (action === 'DELETE' && (perms.includes('HOSO_TAI_LIEU_DELETE') || perms.includes('HOSO_DELETE'))) {
    return true;
  }

  if (!maLoaiTaiLieu) return false;
  return perms.includes(buildTaiLieuGroupPermissionCode(maLoaiTaiLieu, action));
}

// Bản đồ tương thích ngược mở rộng các mã quyền cũ thành các quyền chi tiết
export const LEGACY_PERMISSION_MAP: Record<string, string[]> = {
  HOSO_TAI_LIEU: ['HOSO_TAI_LIEU_VIEW', 'HOSO_TAI_LIEU_UPLOAD', 'HOSO_TAI_LIEU_REPLACE', 'HOSO_TAI_LIEU_DELETE'],
  HOSO_THAY_DOI: ['HOSO_THAY_DOI_VIEW', 'HOSO_THAY_DOI_CREATE', 'HOSO_THAY_DOI_UPDATE', 'HOSO_THAY_DOI_DELETE'],
  CONG_TY_MANAGE: ['CONG_TY_VIEW', 'CONG_TY_CREATE', 'CONG_TY_UPDATE', 'CONG_TY_DELETE'],
  DANH_MUC_MANAGE: ['DANH_MUC_VIEW', 'DANH_MUC_CREATE', 'DANH_MUC_UPDATE', 'DANH_MUC_DELETE'],
  USERS_MANAGE: ['USERS_VIEW', 'USERS_SYNC', 'USERS_ASSIGN_ROLE', 'USERS_CUSTOM_PERM'],
  ROLES_MANAGE: ['ROLES_VIEW', 'ROLES_CREATE', 'ROLES_UPDATE', 'ROLES_DELETE'],
  EMAIL_CONFIG: ['EMAIL_VIEW', 'EMAIL_UPDATE', 'EMAIL_TEST'],
  SYSTEM_LOGS: ['SYSTEM_LOGS_VIEW', 'SYSTEM_LOGS_EXPORT'],
};

/**
 * Mở rộng danh sách quyền: nếu người dùng hoặc vai trò có mã quyền nhóm cũ,
 * tự động bung ra các quyền CRUD chi tiết để đảm bảo tương thích 100%.
 */
export function expandPermissions(perms: string[]): string[] {
  if (!perms || !Array.isArray(perms)) return [];
  if (perms.includes('*')) return ['*'];
  const result = new Set<string>();
  for (const p of perms) {
    if (LEGACY_PERMISSION_MAP[p]) {
      for (const expanded of LEGACY_PERMISSION_MAP[p]) {
        result.add(expanded);
      }
    } else {
      result.add(p);
    }
  }
  return Array.from(result);
}
