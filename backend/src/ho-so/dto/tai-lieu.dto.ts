import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TaiLieuDto {
  @ApiProperty({ description: 'Tên tài liệu' })
  @IsString()
  @IsNotEmpty({ message: 'Tên tài liệu không được để trống' })
  ten_tai_lieu: string;

  @ApiProperty({ description: 'Đường dẫn URL của file' })
  @IsString()
  @IsNotEmpty({ message: 'Đường dẫn tài liệu không được để trống' })
  duong_dan_url: string;

  @ApiPropertyOptional({ description: 'ID loại tài liệu (nếu bỏ trống sẽ mặc định là KHAC)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  loai_tai_lieu_id?: number;

  @ApiPropertyOptional({ description: 'Ngày hiệu lực (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  ngay_hieu_luc?: string;

  @ApiPropertyOptional({ description: 'Ngày hết hiệu lực (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  ngay_het_hieu_luc?: string;

  @ApiPropertyOptional({ description: 'Ghi chú thêm' })
  @IsString()
  @IsOptional()
  ghi_chu?: string;

  @ApiPropertyOptional({ description: 'Dữ liệu các trường động theo loại tài liệu' })
  @IsOptional()
  @IsObject()
  du_lieu_dac_thu?: Record<string, any>;
}

export class UpdateTaiLieuDto {
  @ApiPropertyOptional({ description: 'Tên tài liệu' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Tên tài liệu không được để trống' })
  ten_tai_lieu?: string;

  @ApiPropertyOptional({ description: 'Đường dẫn URL của file' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Đường dẫn tài liệu không được để trống' })
  duong_dan_url?: string;

  @ApiPropertyOptional({ description: 'ID loại tài liệu' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  loai_tai_lieu_id?: number;

  @ApiPropertyOptional({ description: 'Ngày hiệu lực (YYYY-MM-DD)', nullable: true })
  @IsOptional()
  @IsDateString()
  ngay_hieu_luc?: string | null;

  @ApiPropertyOptional({ description: 'Ngày hết hiệu lực (YYYY-MM-DD)', nullable: true })
  @IsOptional()
  @IsDateString()
  ngay_het_hieu_luc?: string | null;

  @ApiPropertyOptional({ description: 'Ghi chú thêm', nullable: true })
  @IsOptional()
  @IsString()
  ghi_chu?: string | null;

  @ApiPropertyOptional({ description: 'Dữ liệu các trường động theo loại tài liệu', nullable: true })
  @IsOptional()
  @IsObject()
  du_lieu_dac_thu?: Record<string, any> | null;
}

export class ReplaceTaiLieuDto {
  @ApiProperty({ description: 'Đường dẫn URL file phiên bản mới' })
  @IsString()
  @IsNotEmpty({ message: 'Đường dẫn tài liệu không được để trống' })
  duong_dan_url: string;

  @ApiPropertyOptional({ description: 'Tên tài liệu mới' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ten_tai_lieu?: string;

  @ApiPropertyOptional({ description: 'ID loại tài liệu mới' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  loai_tai_lieu_id?: number;

  @ApiPropertyOptional({ description: 'Ngày hiệu lực phiên bản mới (YYYY-MM-DD)', nullable: true })
  @IsOptional()
  @IsDateString()
  ngay_hieu_luc?: string | null;

  @ApiPropertyOptional({ description: 'Ngày hết hiệu lực phiên bản mới (YYYY-MM-DD)', nullable: true })
  @IsOptional()
  @IsDateString()
  ngay_het_hieu_luc?: string | null;

  @ApiPropertyOptional({ description: 'Ghi chú phiên bản mới', nullable: true })
  @IsOptional()
  @IsString()
  ghi_chu?: string | null;

  @ApiPropertyOptional({ description: 'Dữ liệu trường động phiên bản mới', nullable: true })
  @IsOptional()
  @IsObject()
  du_lieu_dac_thu?: Record<string, any> | null;
}
