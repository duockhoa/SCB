import { PartialType } from '@nestjs/swagger';
import { CreateCongTyDto } from './create-cong-ty.dto';

export class UpdateCongTyDto extends PartialType(CreateCongTyDto) {}
