import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

export const ROLES_KEY = 'roles';
export interface RequiredRole {
  department?: string;
  position?: string;
  role?: string;
}
export const RequireRole = (role: RequiredRole) => SetMetadata(ROLES_KEY, role);
