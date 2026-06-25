import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LogsService } from './logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequireRole } from '../auth/decorators/roles.decorator';

@Controller('logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  @RequireRole({ position: 'PT' })
  async getLogs(
    @Query('page') page: string,
    @Query('limit') limit: string
  ) {
    return this.logsService.getLogs(Number(page) || 1, Number(limit) || 20);
  }
}
