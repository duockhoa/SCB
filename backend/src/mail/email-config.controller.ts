import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { EmailConfigService } from './email-config.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Email Config')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('email-config')
export class EmailConfigController {
  constructor(
    private readonly emailConfigService: EmailConfigService,
    private readonly prisma: PrismaService
  ) { }

  // Check custom permission based on JWT payload (similar to frontend)
  private checkManagePermission(req: any) {
    const user = req.user || {};
    if (!req.user) throw new ForbiddenException('User not found in request');

    // Nếu JWT không chứa các thông tin này (vì HRM lưu ở cookie riêng), ta sẽ đọc thêm từ Cookie
    if (!user.position || !user.name) {
      const cookieHeader = req.headers.cookie;
      if (cookieHeader) {
        cookieHeader.split(';').forEach((cookie: string) => {
          const parts = cookie.split('=');
          const key = parts[0].trim();
          const value = decodeURIComponent(parts.slice(1).join('='));
          if (key === 'position') user.position = value;
          if (key === 'name') user.name = value;
          if (key === 'username') user.username = value;
          if (key === 'email') user.email = value;
        });
      }
    }

    const isLeHoangCuong = user.name?.toLowerCase().includes('lê hoàng cương') || 
                           user.name?.toLowerCase().includes('le hoang cuong') ||
                           user.username?.toLowerCase().includes('lehoangcuong') ||
                           user.email?.toLowerCase().includes('lehoangcuong');
    
    // Kiểm tra quyền theo position (Phó giám đốc / Trưởng phòng) từ HRM token/cookie
    const isTruongPhong = user.position === 'PT' || isLeHoangCuong;

    if (!isTruongPhong) {
      throw new ForbiddenException(`Bạn không có quyền cấu hình Email. Vai trò hiện tại: ${user.position || 'N/A'}`);
    }
  }

  @Get('smtp')
  @ApiOperation({ summary: 'Lấy cấu hình SMTP hiện tại (không trả về pass)' })
  async getSmtp(@Req() req) {
    this.checkManagePermission(req);
    return this.emailConfigService.getSmtpConfig();
  }

  @Post('smtp')
  @ApiOperation({ summary: 'Lưu hoặc cập nhật cấu hình SMTP' })
  async saveSmtp(@Req() req, @Body() data: any) {
    this.checkManagePermission(req);
    return this.emailConfigService.saveSmtpConfig(data);
  }

  @Post('smtp/test')
  @ApiOperation({ summary: 'Gửi email test nghiệm thu cấu hình' })
  async testSmtp(@Req() req, @Body() body: { test_email: string }) {
    this.checkManagePermission(req);
    return this.emailConfigService.testSmtpConnection(body.test_email);
  }

  @Get('recipients')
  @ApiOperation({ summary: 'Lấy danh sách cấu hình nhận mail (simplified)' })
  async getRecipients(@Req() req) {
    this.checkManagePermission(req);
    return this.emailConfigService.getRecipients();
  }

  @Post('recipients')
  @ApiOperation({ summary: 'Thêm người nhận mail' })
  async addRecipient(@Req() req, @Body() data: any) {
    this.checkManagePermission(req);
    return this.emailConfigService.addRecipient(data);
  }

  @Put('recipients/:id')
  @ApiOperation({ summary: 'Cập nhật người nhận mail' })
  async updateRecipient(@Req() req, @Param('id') id: string, @Body() data: any) {
    this.checkManagePermission(req);
    return this.emailConfigService.updateRecipient(Number(id), data);
  }

  @Delete('recipients/:id')
  @ApiOperation({ summary: 'Xóa người nhận mail' })
  async deleteRecipient(@Req() req, @Param('id') id: string) {
    this.checkManagePermission(req);
    return this.emailConfigService.deleteRecipient(Number(id));
  }

  @Get('events')
  @ApiOperation({ summary: 'Lấy danh sách các sự kiện được bật gửi mail' })
  async getEvents(@Req() req) {
    this.checkManagePermission(req);
    return this.emailConfigService.getEvents();
  }

  @Post('events')
  @ApiOperation({ summary: 'Lưu cấu hình sự kiện gửi mail' })
  async saveEvents(@Req() req, @Body() data: { events: string[] }) {
    this.checkManagePermission(req);
    return this.emailConfigService.saveEvents(data);
  }
}
