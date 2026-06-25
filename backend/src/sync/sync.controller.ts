import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { SyncService } from './sync.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('users')
  @UseGuards(AuthGuard('jwt'))
  async syncUsers(@Req() req: any) {
    const authHeader = req.headers.authorization;
    return this.syncService.syncUsersFromHRM(authHeader);
  }
}
