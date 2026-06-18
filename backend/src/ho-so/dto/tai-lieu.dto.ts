import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TaiLieuDto {
  @ApiProperty({ description: 'Tên tài liệu' })
  @IsString()
  @IsNotEmpty()
  ten_tai_lieu: string;

  @ApiProperty({ description: 'Đường dẫn URL của file' })
  @IsString()
  @IsNotEmpty()
  duong_dan_url: string;

  @ApiProperty({ description: 'Ghi chú thêm', required: false })
  @IsString()
  @IsOptional()
  ghi_chu?: string;
}
