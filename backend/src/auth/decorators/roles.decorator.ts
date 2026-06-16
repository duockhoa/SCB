import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export interface RequiredRole {
  department?: string;
  position?: string;
}

export const RequireRole = (role: RequiredRole) => SetMetadata(ROLES_KEY, role);
