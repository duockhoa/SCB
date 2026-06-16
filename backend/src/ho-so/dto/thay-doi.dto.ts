import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class ThayDoiDto {
  @ApiPropertyOptional({ description: 'ID Loại thay đổi' })
  @IsOptional()
  @IsNumber()
  loai_thay_doi_id?: number;

  @ApiPropertyOptional({ description: 'Lần thay đổi thứ mấy' })
  @IsOptional()
  @IsNumber()
  lan_thu?: number;

  @ApiPropertyOptional({ description: 'Nội dung thay đổi' })
  @IsOptional()
  @IsString()
  noi_dung_thay_doi?: string;

  @ApiPropertyOptional({ description: 'Mã số công văn/quyết định' })
  @IsOptional()
  @IsString()
  ma_so_tham_chieu?: string;

  @ApiPropertyOptional({ description: 'Ngày thay đổi/phê duyệt' })
  @IsOptional()
  @IsDateString()
  ngay_thay_doi?: Date;

  @ApiPropertyOptional({ description: 'Ngày công văn/quyết định' })
  @IsOptional()
  @IsDateString()
  ngay_phe_duyet?: Date;

  @ApiPropertyOptional({ description: 'Tình trạng phê duyệt' })
  @IsOptional()
  @IsString()
  tinh_trang?: string;

  @ApiPropertyOptional({ description: 'Link tải file công văn' })
  @IsOptional()
  @IsString()
  cong_van_url?: string;

  @ApiPropertyOptional({ description: 'Ghi chú thêm' })
  @IsOptional()
  @IsString()
  ghi_chu?: string;
}
