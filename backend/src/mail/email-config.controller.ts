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

  // Check custom permission
  private async checkManagePermission(req: any) {
    const userId = req.user.userId;
    const user = await this.prisma.nguoi_dung.findUnique({
      where: { id: userId },
      include: { vai_tro: true }
    });

    if (!user) throw new ForbiddenException('User not found');

    const isLeHoangCuong = user.ho_ten.toLowerCase().includes('lê hoàng cương') ||
      user.ma_nguoi_dung?.toLowerCase().includes('lehoangcuong') ||
      user.email.toLowerCase().includes('lehoangcuong');

    // Check if role is EMAIL_CONFIG_MANAGE or Truong phong
    const hasPermission = isLeHoangCuong || user.vai_tro.ma_vai_tro === 'EMAIL_CONFIG_MANAGE' || user.vai_tro.ma_vai_tro === 'PT';

    if (!hasPermission) {
      throw new ForbiddenException('You do not have EMAIL_CONFIG_MANAGE permission');
    }
  }

  @Get('smtp')
  @ApiOperation({ summary: 'Lấy cấu hình SMTP hiện tại (không trả về pass)' })
  async getSmtp(@Req() req) {
    await this.checkManagePermission(req);
    return this.emailConfigService.getSmtpConfig();
  }

  @Post('smtp')
  @ApiOperation({ summary: 'Lưu hoặc cập nhật cấu hình SMTP' })
  async saveSmtp(@Req() req, @Body() data: any) {
    await this.checkManagePermission(req);
    return this.emailConfigService.saveSmtpConfig(data);
  }

  @Post('smtp/test')
  @ApiOperation({ summary: 'Gửi email test nghiệm thu cấu hình' })
  async testSmtp(@Req() req, @Body() body: { test_email: string }) {
    await this.checkManagePermission(req);
    return this.emailConfigService.testSmtpConnection(body.test_email);
  }

  @Get('recipients')
  @ApiOperation({ summary: 'Lấy danh sách cấu hình nhận mail (simplified)' })
  async getRecipients(@Req() req) {
    await this.checkManagePermission(req);
    return this.emailConfigService.getRecipients();
  }

  @Post('recipients')
  @ApiOperation({ summary: 'Thêm người nhận mail' })
  async addRecipient(@Req() req, @Body() data: any) {
    await this.checkManagePermission(req);
    return this.emailConfigService.addRecipient(data);
  }

  @Put('recipients/:id')
  @ApiOperation({ summary: 'Cập nhật người nhận mail' })
  async updateRecipient(@Req() req, @Param('id') id: string, @Body() data: any) {
    await this.checkManagePermission(req);
    return this.emailConfigService.updateRecipient(Number(id), data);
  }

  @Delete('recipients/:id')
  @ApiOperation({ summary: 'Xóa người nhận mail' })
  async deleteRecipient(@Req() req, @Param('id') id: string) {
    await this.checkManagePermission(req);
    return this.emailConfigService.deleteRecipient(Number(id));
  }

  @Get('events')
  @ApiOperation({ summary: 'Lấy danh sách các sự kiện được bật gửi mail' })
  async getEvents(@Req() req) {
    await this.checkManagePermission(req);
    return this.emailConfigService.getEvents();
  }

  @Post('events')
  @ApiOperation({ summary: 'Lưu cấu hình sự kiện gửi mail' })
  async saveEvents(@Req() req, @Body() data: { events: string[] }) {
    await this.checkManagePermission(req);
    return this.emailConfigService.saveEvents(data);
  }
}
