import { Controller, Post, Get, Put, Body, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { FileAccessService } from './file-access.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('File Access')
@UseGuards(AuthGuard('jwt'))
@Controller('file-access')
export class FileAccessController {
  constructor(private readonly fileAccessService: FileAccessService) {}

  @Post('request')
  async requestAccess(@Req() req: any, @Body() body: { taiLieuId?: number; fileName?: string; lyDo: string }) {
    return this.fileAccessService.requestAccess(req.user.userId, body.taiLieuId || null, body.fileName || null, body.lyDo);
  }

  @Get('requests')
  async getRequests(@Req() req: any) {
    const user = req.user;
    const DEVELOPER_USERNAMES = (process.env.DEVELOPER_USERNAMES || 'lehoangcuong').split(',').map(s => s.trim().toLowerCase());
    const isDeveloper = DEVELOPER_USERNAMES.includes(user.username?.toLowerCase() || '');
    const isTruongPhongDangKy = user.department === (process.env.DEPT_REGISTRATION || 'Đăng ký') && user.position === (process.env.ROLE_MANAGER || 'TP');

    if (!isDeveloper && !isTruongPhongDangKy) {
      throw new ForbiddenException('Bạn không có quyền xem danh sách phê duyệt');
    }

    return this.fileAccessService.getRequests();
  }

  @Put('approve/:id')
  async approveRequest(@Req() req: any, @Param('id') id: string, @Body() body: { hours: number }) {
    const user = req.user;
    const DEVELOPER_USERNAMES = (process.env.DEVELOPER_USERNAMES || 'lehoangcuong').split(',').map(s => s.trim().toLowerCase());
    const isDeveloper = DEVELOPER_USERNAMES.includes(user.username?.toLowerCase() || '');
    const isTruongPhongDangKy = user.department === (process.env.DEPT_REGISTRATION || 'Đăng ký') && user.position === (process.env.ROLE_MANAGER || 'TP');

    if (!isDeveloper && !isTruongPhongDangKy) {
      throw new ForbiddenException('Bạn không có quyền phê duyệt');
    }

    return this.fileAccessService.approveRequest(+id, user.userId, body.hours);
  }

  @Put('reject/:id')
  async rejectRequest(@Req() req: any, @Param('id') id: string) {
    const user = req.user;
    const DEVELOPER_USERNAMES = (process.env.DEVELOPER_USERNAMES || 'lehoangcuong').split(',').map(s => s.trim().toLowerCase());
    const isDeveloper = DEVELOPER_USERNAMES.includes(user.username?.toLowerCase() || '');
    const isTruongPhongDangKy = user.department === (process.env.DEPT_REGISTRATION || 'Đăng ký') && user.position === (process.env.ROLE_MANAGER || 'TP');

    if (!isDeveloper && !isTruongPhongDangKy) {
      throw new ForbiddenException('Bạn không có quyền phê duyệt');
    }

    return this.fileAccessService.rejectRequest(+id, user.userId);
  }
}
