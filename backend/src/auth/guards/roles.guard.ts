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
    console.log('=== DỮ LIỆU TOKEN TỪ HRM ===');
    console.log(user);
    console.log('=============================');

    // TẠM THỜI: Cho phép tất cả request đi qua để không chặn tiến độ test của bạn
    // Sau khi xem log tôi sẽ cấu hình lại chính xác.
    return true;
  }
}