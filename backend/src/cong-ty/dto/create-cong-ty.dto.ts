import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateCongTyDto {
  @ApiProperty({ description: 'Mã công ty', example: 'CTY_ABC' })
  @IsString()
  @IsNotEmpty({ message: 'Mã công ty không được để trống' })
  ma_cong_ty: string;

  @ApiProperty({ description: 'Tên công ty', example: 'Công ty ABC' })
  @IsString()
  @IsNotEmpty({ message: 'Tên công ty không được để trống' })
  ten_cong_ty: string;

  @ApiPropertyOptional({ description: 'Tên viết tắt' })
  @IsOptional()
  @IsString()
  ten_viet_tat?: string;

  @ApiPropertyOptional({ description: 'Địa chỉ' })
  @IsOptional()
  @IsString()
  dia_chi?: string;

  @ApiPropertyOptional({ description: 'Mã số thuế' })
  @IsOptional()
  @IsString()
  ma_so_thue?: string;

  @ApiPropertyOptional({ description: 'Người đại diện' })
  @IsOptional()
  @IsString()
  nguoi_dai_dien?: string;

  @ApiPropertyOptional({ description: 'Trạng thái hoạt động', default: true })
  @IsOptional()
  @IsBoolean()
  trang_thai?: boolean;
}
