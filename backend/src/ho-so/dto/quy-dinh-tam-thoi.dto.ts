import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class QuyDinhTamThoiDto {
  @ApiProperty({ description: 'Bật/tắt áp dụng quy định tạm thời' })
  @IsBoolean()
  ap_dung_quy_dinh_tam_thoi: boolean;

  @ApiPropertyOptional({ description: 'Ngày hết hạn theo quy định tạm thời' })
  @IsOptional()
  @IsDateString()
  ngay_het_han_quy_dinh?: Date;

  @ApiPropertyOptional({ description: 'Căn cứ pháp lý quy định (Số Nghị định, Nghị quyết, Công văn...)' })
  @IsOptional()
  @IsString()
  can_cu_quy_dinh?: string;

  @ApiPropertyOptional({ description: 'Đường dẫn file tài liệu/văn bản quy định đính kèm' })
  @IsOptional()
  @IsString()
  tai_lieu_quy_dinh_url?: string;

  @ApiPropertyOptional({ description: 'Ghi chú thêm' })
  @IsOptional()
  @IsString()
  ghi_chu?: string;
}
