export declare const ROLES_KEY = "roles";
export interface RequiredRole {
    department?: string;
    position?: string;
}
export declare const RequireRole: (role: RequiredRole) => import("@nestjs/common").CustomDecorator<string>;
