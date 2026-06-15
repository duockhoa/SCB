import { PartialType } from '@nestjs/swagger';
import { CreateHoSoDto } from './create-ho-so.dto';

export class UpdateHoSoDto extends PartialType(CreateHoSoDto) {}
