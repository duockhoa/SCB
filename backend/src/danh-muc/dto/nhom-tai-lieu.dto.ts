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
} from 'class-validator';

export class CreateNhomTaiLieuDto {
  @ApiProperty({ example: 'TAI_LIEU_SAN_XUAT' })
  @IsString()
  @IsNotEmpty({ message: 'Mã nhóm tài liệu không được để trống' })
  @MaxLength(50)
  ma_nhom: string;

  @ApiProperty({ example: 'Tài liệu sản xuất' })
  @IsString()
  @IsNotEmpty({ message: 'Tên nhóm tài liệu không được để trống' })
  @MaxLength(200)
  ten_nhom: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  mo_ta?: string;

  @ApiPropertyOptional({ example: 'teal' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  mau_sac?: string;

  @ApiPropertyOptional({ example: 3 })
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
}

export class UpdateNhomTaiLieuDto {
  @ApiPropertyOptional({ example: 'TAI_LIEU_SAN_XUAT' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Mã nhóm tài liệu không được để trống' })
  @MaxLength(50)
  ma_nhom?: string;

  @ApiPropertyOptional({ example: 'Tài liệu sản xuất' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Tên nhóm tài liệu không được để trống' })
  @MaxLength(200)
  ten_nhom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  mo_ta?: string | null;

  @ApiPropertyOptional({ example: 'teal' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  mau_sac?: string | null;

  @ApiPropertyOptional({ example: 3 })
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
}

