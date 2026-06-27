import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, RequiredRole } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRole = this.reflector.getAllAndOverride<RequiredRole>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRole) {
      return true; // Không yêu cầu quyền gì cụ thể
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      throw new ForbiddenException('Chưa xác thực người dùng');
    }

    // TẠM THỜI: In toàn bộ cấu trúc Token ra log để phân tích xem HRM gửi sang những gì
    // console.log('=== DỮ LIỆU TOKEN TỪ HRM ===');
    // console.log(user);
    // console.log('=============================');

    // Kiểm tra đặc quyền Developer (Admin tối cao)
    const DEVELOPER_USERNAMES = (process.env.DEVELOPER_USERNAMES || 'lehoangcuong').split(',').map(s => s.trim().toLowerCase());
    const isDeveloper = DEVELOPER_USERNAMES.includes(user.username?.toLowerCase() || '');
    if (isDeveloper) {
      return true;
    }

    // Kiểm tra quyền theo phòng ban
    if (requiredRole.department) {
      // Đổi literal string thành biến môi trường
      let expectedDept = requiredRole.department;
      if (expectedDept === 'Đăng ký') expectedDept = process.env.DEPT_REGISTRATION || 'Đăng ký';

      if (user.department !== expectedDept) {
        throw new ForbiddenException(`Bạn không thuộc bộ phận ${expectedDept} để thực hiện hành động này`);
      }
    }

    // Kiểm tra quyền theo chức vụ (vd: TP)
    if (requiredRole.position) {
      let expectedPos = requiredRole.position;
      if (expectedPos === 'TP') expectedPos = process.env.ROLE_MANAGER || 'TP';
      else if (expectedPos === 'NV') expectedPos = process.env.ROLE_STAFF || 'NV';

      if (user.position !== expectedPos) {
        throw new ForbiddenException(`Hành động này yêu cầu chức vụ cấp ${expectedPos}`);
      }
    }

    return true;
  }
}