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

    // Kiểm tra Department
    if (requiredRole.department && user.department !== requiredRole.department) {
      throw new ForbiddenException(`Chỉ nhân sự thuộc bộ phận ${requiredRole.department} mới có quyền thực hiện thao tác này`);
    }

    // Kiểm tra Position (nếu yêu cầu)
    if (requiredRole.position && user.position !== requiredRole.position) {
      throw new ForbiddenException(`Chỉ ${requiredRole.position} thuộc ${requiredRole.department} mới có quyền thực hiện thao tác này`);
    }

    return true;
  }
}
