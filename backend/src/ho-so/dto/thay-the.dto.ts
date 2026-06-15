import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class ThayTheDto {
  @ApiProperty({ description: 'Mã hồ sơ hệ thống mới' })
  @IsString()
  @IsNotEmpty()
  ma_ho_so_moi: string;

  @ApiProperty({ description: 'Số đăng ký / Số công bố mới' })
  @IsString()
  @IsNotEmpty()
  so_chinh_moi: string;

  @ApiProperty({ description: 'Ngày bắt đầu có hiệu lực mới' })
  @IsDateString()
  ngay_cong_bo: Date;

  @ApiPropertyOptional({ description: 'Ngày hết hiệu lực mới' })
  @IsOptional()
  @IsDateString()
  ngay_het_han?: Date;

  @ApiPropertyOptional({ description: 'Ngày cần nhắc nhở mới' })
  @IsOptional()
  @IsDateString()
  ngay_nhac_han?: Date;
}
