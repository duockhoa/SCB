import { Module } from '@nestjs/common';
import { HoSoController } from './ho-so.controller';
import { HoSoService } from './ho-so.service';

@Module({
  controllers: [HoSoController],
  providers: [HoSoService]
})
export class HoSoModule {}
