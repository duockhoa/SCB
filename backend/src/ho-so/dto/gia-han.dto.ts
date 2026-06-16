import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';
import { ThayDoiDto } from './thay-doi.dto';

export class GiaHanDto extends ThayDoiDto {
  @ApiProperty({ description: 'Ngày hết hiệu lực mới' })
  @IsDateString()
  ngay_het_han: Date;

  @ApiPropertyOptional({ description: 'Ngày cần nhắc nhở mới' })
  @IsOptional()
  @IsDateString()
  ngay_nhac_han?: Date;
}
