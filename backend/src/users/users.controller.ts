import { Controller, Get, Put, Body, Param, ParseIntPipe, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Users Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private checkDeveloper(req: any) {
    const user = req.user;
    const DEVELOPER_USERNAMES = (process.env.DEVELOPER_USERNAMES || 'lehoangcuong').split(',').map(s => s.trim().toLowerCase());
    const isDeveloper = DEVELOPER_USERNAMES.includes(user.username?.toLowerCase() || '');
    if (!isDeveloper) {
      throw new ForbiddenException('Bạn không có quyền thực hiện hành động này');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách người dùng' })
  findAll(@Req() req: any) {
    this.checkDeveloper(req);
    return this.usersService.findAll();
  }

  @Get('roles')
  @ApiOperation({ summary: 'Lấy danh sách vai trò' })
  getRoles(@Req() req: any) {
    this.checkDeveloper(req);
    return this.usersService.getRoles();
  }

  @Put(':id/role')
  @ApiOperation({ summary: 'Cập nhật vai trò người dùng' })
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { roleId: number | null },
    @Req() req: any
  ) {
    this.checkDeveloper(req);
    return this.usersService.updateRole(id, body.roleId);
  }
}
