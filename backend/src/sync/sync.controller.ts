import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequirePermissions } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Sync HRM')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('users')
  @ApiOperation({ summary: 'Đồng bộ người dùng từ HRM' })
  @RequirePermissions('USERS_MANAGE')
  async syncUsers(@Req() req: any) {
    const authHeader = req.headers.authorization;
    return this.syncService.syncUsersFromHRM(authHeader);
  }
}
