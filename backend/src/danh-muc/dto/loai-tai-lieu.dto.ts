import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CustomFieldConfigDto } from './loai-ho-so.dto';

export class CreateLoaiTaiLieuDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  nhom_tai_lieu_id?: number;

  @ApiProperty({ example: 'GIAY_PHEP_QUANG_CAO' })
  @IsString()
  @IsNotEmpty({ message: 'Mã loại tài liệu không được để trống' })
  @MaxLength(50)
  ma_loai_tai_lieu: string;

  @ApiProperty({ example: 'Giấy phép quảng cáo' })
  @IsString()
  @IsNotEmpty({ message: 'Tên loại tài liệu không được để trống' })
  @MaxLength(200)
  ten_loai_tai_lieu: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  mo_ta?: string;

  @ApiPropertyOptional({ example: 'purple' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  mau_sac?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  thu_tu?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  trang_thai?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  ap_dung_tat_ca?: boolean;

  @ApiPropertyOptional({ type: [Number], example: [1, 2] })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  loai_ho_so_ids?: number[];

  @ApiPropertyOptional({ type: [CustomFieldConfigDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomFieldConfigDto)
  cau_hinh_truong?: CustomFieldConfigDto[];
}

export class UpdateLoaiTaiLieuDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  nhom_tai_lieu_id?: number | null;

  @ApiPropertyOptional({ example: 'GIAY_PHEP_QUANG_CAO' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Mã loại tài liệu không được để trống' })
  @MaxLength(50)
  ma_loai_tai_lieu?: string;

  @ApiPropertyOptional({ example: 'Giấy phép quảng cáo' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Tên loại tài liệu không được để trống' })
  @MaxLength(200)
  ten_loai_tai_lieu?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  mo_ta?: string | null;

  @ApiPropertyOptional({ example: 'purple' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  mau_sac?: string | null;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  thu_tu?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  trang_thai?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ap_dung_tat_ca?: boolean;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  loai_ho_so_ids?: number[];

  @ApiPropertyOptional({ type: [CustomFieldConfigDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomFieldConfigDto)
  cau_hinh_truong?: CustomFieldConfigDto[];
}

