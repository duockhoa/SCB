import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { ThayDoiDto } from './thay-doi.dto';

export class CapSoDto extends ThayDoiDto {
  @ApiProperty({ description: 'Số đăng ký / Số công bố' })
  @IsString()
  @IsNotEmpty()
  so_chinh: string;

  @ApiProperty({ description: 'Ngày bắt đầu có hiệu lực' })
  @IsDateString()
  ngay_cong_bo: Date;

  @ApiPropertyOptional({ description: 'Ngày hết hiệu lực' })
  @IsOptional()
  @IsDateString()
  ngay_het_han?: Date;

  @ApiPropertyOptional({ description: 'Ngày cần nhắc nhở' })
  @IsOptional()
  @IsDateString()
  ngay_nhac_han?: Date;
}
