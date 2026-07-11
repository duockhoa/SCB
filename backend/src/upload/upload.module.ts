import { Module } from '@nestjs/common';
import { UploadController, LegacyUploadController } from './upload.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UploadController, LegacyUploadController],
})
export class UploadModule {}
