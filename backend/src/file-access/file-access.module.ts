import { Module } from '@nestjs/common';
import { FileAccessService } from './file-access.service';
import { FileAccessController } from './file-access.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  providers: [FileAccessService],
  controllers: [FileAccessController]
})
export class FileAccessModule {}
