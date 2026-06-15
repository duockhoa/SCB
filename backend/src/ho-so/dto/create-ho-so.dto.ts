import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsDateString, IsObject } from 'class-validator';

export class CreateHoSoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ma_ho_so: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  so_chinh?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ma_san_pham_noi_bo?: string;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  loai_ho_so_id: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ten_san_pham: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ten_san_pham_khong_dau?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  cong_ty_so_huu_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  cong_ty_dung_ten_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  cong_ty_phan_phoi_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  ngay_cong_bo?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  ngay_het_han?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  tinh_trang_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ho_so_luu_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ghi_chu?: string;

  @ApiPropertyOptional({ description: 'Dữ liệu thông tin riêng của loại hồ sơ đó' })
  @IsOptional()
  @IsObject()
  thong_tin_rieng?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  nguoi_thuc_hien_id?: number;
}
