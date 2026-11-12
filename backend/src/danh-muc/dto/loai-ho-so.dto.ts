import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export const CUSTOM_FIELD_TYPES = ['text', 'textarea', 'number', 'date', 'select', 'file'] as const;
export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number];

export class CustomFieldConfigDto {
  @ApiProperty({ example: 'so_giay_phep' })
  @IsString()
  @IsNotEmpty({ message: 'Mã trường không được để trống' })
  @MaxLength(80)
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message: 'Mã trường phải bắt đầu bằng chữ thường và chỉ gồm chữ thường, số, gạch dưới',
  })
  key: string;

  @ApiProperty({ example: 'Số giấy phép' })
  @IsString()
  @IsNotEmpty({ message: 'Tên hiển thị trường không được để trống' })
  @MaxLength(200)
  label: string;

  @ApiProperty({ enum: CUSTOM_FIELD_TYPES })
  @IsIn(CUSTOM_FIELD_TYPES, { message: 'Kiểu dữ liệu trường không hợp lệ' })
  type: CustomFieldType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  placeholder?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ enum: [12, 24] })
  @IsOptional()
  @IsIn([12, 24], { message: 'Độ rộng cột chỉ nhận 12 hoặc 24' })
  colSpan?: 12 | 24;
}

export class CreateLoaiHoSoDto {
  @ApiProperty({ example: 'THUC_PHAM_THUONG' })
  @IsString()
  @IsNotEmpty({ message: 'Mã loại hồ sơ không được để trống' })
  @MaxLength(50)
  ma_loai: string;

  @ApiProperty({ example: 'Hồ sơ thực phẩm thường' })
  @IsString()
  @IsNotEmpty({ message: 'Tên loại hồ sơ không được để trống' })
  @MaxLength(200)
  ten_loai: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  mo_ta?: string;

  @ApiPropertyOptional({ example: 'blue' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  mau_sac?: string;

  @ApiPropertyOptional({ example: 7 })
  @IsOptional()
  @IsInt()
  @Min(0)
  thu_tu?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  trang_thai?: boolean;

  @ApiPropertyOptional({ default: 6 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  thoi_gian_canh_bao?: number;

  @ApiPropertyOptional({ enum: ['THANG', 'NGAY'], default: 'THANG' })
  @IsOptional()
  @IsIn(['THANG', 'NGAY'])
  don_vi_canh_bao?: string;

  @ApiPropertyOptional({ type: [CustomFieldConfigDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomFieldConfigDto)
  cau_hinh_truong?: CustomFieldConfigDto[];
}

export class UpdateLoaiHoSoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Mã loại hồ sơ không được để trống' })
  @MaxLength(50)
  ma_loai?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Tên loại hồ sơ không được để trống' })
  @MaxLength(200)
  ten_loai?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  mo_ta?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  mau_sac?: string | null;

  @ApiPropertyOptional()
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
  @IsInt()
  @Min(1)
  @Max(365)
  thoi_gian_canh_bao?: number;

  @ApiPropertyOptional({ enum: ['THANG', 'NGAY'] })
  @IsOptional()
  @IsIn(['THANG', 'NGAY'])
  don_vi_canh_bao?: string;

  @ApiPropertyOptional({ type: [CustomFieldConfigDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomFieldConfigDto)
  cau_hinh_truong?: CustomFieldConfigDto[] | null;
}

export class UpdateLoaiHoSoExpiryDto {
  @ApiProperty()
  @IsInt()
  @Min(1, { message: 'Thời gian cảnh báo phải là số nguyên dương' })
  @Max(365)
  thoi_gian_canh_bao: number;

  @ApiPropertyOptional({ enum: ['THANG', 'NGAY'] })
  @IsOptional()
  @IsIn(['THANG', 'NGAY'])
  don_vi_canh_bao?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  dong_bo_tat_ca?: boolean;
}

export class UpdateLoaiHoSoTaiLieuConfigDto {
  @ApiProperty({ type: [Number], description: 'Danh sách ID nhóm tài liệu áp dụng cho loại hồ sơ' })
  @IsArray()
  @IsInt({ each: true })
  nhom_tai_lieu_ids: number[];

  @ApiProperty({ type: [Number], description: 'Danh sách ID loại tài liệu áp dụng cho loại hồ sơ' })
  @IsArray()
  @IsInt({ each: true })
  loai_tai_lieu_ids: number[];
}

