export interface PermissionItem {
  code: string;
  name: string;
  description: string;
}

export interface PermissionModule {
  module: string;
  description: string;
  permissions: PermissionItem[];
}

export const PERMISSION_MODULES: PermissionModule[] = [
  {
    module: 'Hồ sơ Công bố',
    description: 'Quyền thao tác với dữ liệu hồ sơ sản phẩm',
    permissions: [
      { code: 'HOSO_VIEW', name: 'Xem danh sách & chi tiết', description: 'Tra cứu danh sách và xem đầy đủ hồ sơ' },
      { code: 'HOSO_CREATE', name: 'Tạo mới hồ sơ', description: 'Tạo hồ sơ thuốc, mỹ phẩm, TBYT, TPBVSK, CFS' },
      { code: 'HOSO_UPDATE', name: 'Cập nhật hồ sơ', description: 'Chỉnh sửa thông tin chung và đặc thù' },
      { code: 'HOSO_DELETE', name: 'Xóa hồ sơ', description: 'Xóa hồ sơ khỏi hệ thống' },
      { code: 'HOSO_CAP_SO', name: 'Cấp số công bố', description: 'Ghi nhận số công bố / SĐK chính thức' },
      { code: 'HOSO_GIA_HAN', name: 'Gia hạn hồ sơ', description: 'Cập nhật gia hạn hạn dùng hồ sơ' },
      { code: 'HOSO_THAY_THE', name: 'Thay thế hồ sơ', description: 'Đổi số công bố và liên kết hồ sơ thay thế' },
      { code: 'HOSO_THAY_DOI', name: 'Lịch sử thay đổi', description: 'Thêm, sửa các đợt thay đổi nội dung hồ sơ' },
      { code: 'HOSO_TAI_LIEU', name: 'Tài liệu đính kèm', description: 'Tải lên và quản lý tài liệu hồ sơ' },
    ],
  },
  {
    module: 'Công ty & Danh mục',
    description: 'Quyền quản lý danh mục pháp lý dùng chung',
    permissions: [
      { code: 'CONG_TY_VIEW', name: 'Xem công ty', description: 'Xem danh mục công ty sở hữu, đứng tên, phân phối' },
      { code: 'CONG_TY_MANAGE', name: 'Quản lý công ty', description: 'Thêm, sửa, xóa thông tin danh mục công ty' },
      { code: 'DANH_MUC_VIEW', name: 'Xem danh mục hệ thống', description: 'Xem loại hồ sơ, trạng thái, loại tài liệu' },
      { code: 'DANH_MUC_MANAGE', name: 'Quản lý danh mục', description: 'Cấu hình và thêm mới các tham số danh mục' },
    ],
  },
  {
    module: 'Quản trị Hệ thống',
    description: 'Quyền cấu hình người dùng, bảo mật và thông báo',
    permissions: [
      { code: 'USERS_MANAGE', name: 'Quản lý người dùng', description: 'Đồng bộ HRM và gán vai trò người dùng' },
      { code: 'ROLES_MANAGE', name: 'Quản lý nhóm quyền (RBAC)', description: 'Tạo, sửa vai trò và ma trận phân quyền' },
      { code: 'EMAIL_CONFIG', name: 'Cấu hình Email', description: 'Cài đặt SMTP và danh sách email nhận cảnh báo' },
      { code: 'SYSTEM_LOGS', name: 'Nhật ký hệ thống', description: 'Xem lịch sử thao tác API và kiểm toán hệ thống' },
    ],
  },
];

export const ALL_PERMISSION_CODES = PERMISSION_MODULES.flatMap((m) =>
  m.permissions.map((p) => p.code),
);
