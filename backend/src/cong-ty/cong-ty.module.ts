import { Module } from '@nestjs/common';
import { CongTyController } from './cong-ty.controller';
import { CongTyService } from './cong-ty.service';

@Module({
  controllers: [CongTyController],
  providers: [CongTyService]
})
export class CongTyModule {}
