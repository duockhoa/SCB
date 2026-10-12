import { 
  Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards, Req 
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequirePermissions } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Users & RBAC Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách người dùng' })
  @RequirePermissions('USERS_MANAGE', 'ROLES_MANAGE')
  findAll() {
    return this.usersService.findAll();
  }

  @Get('roles')
  @ApiOperation({ summary: 'Lấy danh sách vai trò (kèm danh sách quyền và số lượng người dùng)' })
  @RequirePermissions('ROLES_MANAGE', 'USERS_MANAGE')
  getRoles() {
    return this.usersService.getRoles();
  }

  @Get('permissions')
  @ApiOperation({ summary: 'Lấy danh mục các quyền hạn (Permission Catalog)' })
  @RequirePermissions('ROLES_MANAGE', 'USERS_MANAGE')
  getPermissionsCatalog() {
    return this.usersService.getPermissionsCatalog();
  }

  @Post('roles')
  @ApiOperation({ summary: 'Tạo vai trò mới' })
  @RequirePermissions('ROLES_MANAGE')
  createRole(
    @Body() body: { ma_vai_tro: string; ten_vai_tro: string; mo_ta?: string; quyen_han?: string[] }
  ) {
    return this.usersService.createRole(body);
  }

  @Put('roles/:id')
  @ApiOperation({ summary: 'Cập nhật vai trò và phân quyền chi tiết' })
  @RequirePermissions('ROLES_MANAGE')
  updateRoleDetail(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { ten_vai_tro?: string; mo_ta?: string; quyen_han?: string[] }
  ) {
    return this.usersService.updateRoleDetail(id, body);
  }

  @Delete('roles/:id')
  @ApiOperation({ summary: 'Xóa vai trò' })
  @RequirePermissions('ROLES_MANAGE')
  deleteRole(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteRole(id);
  }

  @Put(':id/role')
  @ApiOperation({ summary: 'Cập nhật vai trò người dùng' })
  @RequirePermissions('USERS_MANAGE', 'ROLES_MANAGE')
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { roleId: number | null }
  ) {
    return this.usersService.updateRole(id, body.roleId);
  }

  @Put(':id/custom-permissions')
  @ApiOperation({ summary: 'Cập nhật quyền riêng biệt ngoại lệ cho từng nhân sự' })
  @RequirePermissions('USERS_MANAGE', 'ROLES_MANAGE')
  updateCustomPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { permissions: string[] }
  ) {
    return this.usersService.updateCustomPermissions(id, body.permissions || []);
  }

  @Get('me')
  @ApiOperation({ summary: 'Lấy thông tin tài khoản hiện tại kèm vai trò & quyền hạn từ DB' })
  getMe(@Req() req: any) {
    return req.user;
  }
}
