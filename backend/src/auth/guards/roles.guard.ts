import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, PERMISSIONS_KEY, RequiredRole } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredRole = this.reflector.getAllAndOverride<RequiredRole>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Nếu endpoint không yêu cầu quyền hay role cụ thể, cho phép
    if (!requiredPermissions && !requiredRole) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('Chưa xác thực người dùng');
    }

    // 1. Đặc quyền Developer tối cao hoặc vai trò ADMIN
    const DEVELOPER_USERNAMES = (process.env.DEVELOPER_USERNAMES || 'lehoangcuong').split(',').map(s => s.trim().toLowerCase());
    const isDeveloper = DEVELOPER_USERNAMES.includes(user.username?.toLowerCase() || '') || user.role === 'ADMIN' || !!user.isAdmin;
    if (isDeveloper) {
      return true;
    }

    const userPerms: string[] = user.permissions || [];

    // 2. Nếu có wildcard '*', toàn quyền thao tác
    if (userPerms.includes('*')) {
      return true;
    }

    // 3. Kiểm tra trực tiếp theo danh sách quyền chi tiết (RBAC Granular Permissions)
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.some(perm => userPerms.includes(perm));
      if (!hasPermission) {
        throw new ForbiddenException(
          `Bạn không có quyền thực hiện hành động này (Yêu cầu: ${requiredPermissions.join(', ')}). Vui lòng liên hệ Quản trị viên để được phân quyền trực tiếp trên ứng dụng.`
        );
      }
      return true;
    }

    // 4. Xử lý tương thích ngược nếu còn endpoint khai báo @RequireRole (Không còn chặn theo phòng ban 'Đăng ký')
    if (requiredRole) {
      if (requiredRole.role && user.role === requiredRole.role) {
        return true;
      }

      const request = context.switchToHttp().getRequest();
      const path = (request.route?.path || request.url || '').toLowerCase();
      const method = request.method;

      if (path.includes('ho-so')) {
        if (method === 'DELETE' && userPerms.includes('HOSO_DELETE')) return true;
        if (method === 'POST' && path.includes('thay-the') && userPerms.includes('HOSO_THAY_THE')) return true;
        if (method === 'POST' && path.includes('gia-han') && userPerms.includes('HOSO_GIA_HAN')) return true;
        if (path.includes('cap-so') && userPerms.includes('HOSO_CAP_SO')) return true;
        if (path.includes('tai-lieu') && userPerms.includes('HOSO_TAI_LIEU')) return true;
        if (path.includes('thay-doi') && userPerms.includes('HOSO_THAY_DOI')) return true;
        if (method === 'POST' && userPerms.includes('HOSO_CREATE')) return true;
        if ((method === 'PUT' || method === 'PATCH') && userPerms.includes('HOSO_UPDATE')) return true;
      }

      if (path.includes('cong-ty') && userPerms.includes('CONG_TY_MANAGE')) return true;
      if (path.includes('email') && userPerms.includes('EMAIL_CONFIG')) return true;
      if (path.includes('logs') && userPerms.includes('SYSTEM_LOGS')) return true;
      if (path.includes('users') && (userPerms.includes('USERS_MANAGE') || userPerms.includes('ROLES_MANAGE'))) return true;

      throw new ForbiddenException(
        'Bạn chưa được cấp quyền thực hiện hành động này trên hệ thống. Vui lòng liên hệ Quản trị viên để được phân quyền qua giao diện Quản lý vai trò.'
      );
    }

    return true;
  }
}