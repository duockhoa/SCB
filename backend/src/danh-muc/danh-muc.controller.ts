import { Controller, Get, Patch, Param, Body, ParseIntPipe } from '@nestjs/common';
import { DanhMucService } from './danh-muc.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Danh Mục')
@Controller('danh-muc')
export class DanhMucController {
  constructor(private readonly danhMucService: DanhMucService) {}

  @Get('loai-ho-so')
  @ApiOperation({ summary: 'Lấy danh mục loại hồ sơ' })
  getLoaiHoSo() {
    return this.danhMucService.getLoaiHoSo();
  }

  @Patch('loai-ho-so/:id/canh-bao-han')
  @ApiOperation({ summary: 'Cập nhật cấu hình cảnh báo hạn cho loại hồ sơ' })
  updateLoaiHoSoExpiry(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { thoi_gian_canh_bao: number; don_vi_canh_bao?: string; dong_bo_tat_ca?: boolean },
  ) {
    return this.danhMucService.updateLoaiHoSoExpiry(id, body);
  }

  @Get('tinh-trang')
  @ApiOperation({ summary: 'Lấy danh mục tình trạng hồ sơ' })
  getTinhTrang() {
    return this.danhMucService.getTinhTrang();
  }

  @Get('loai-tai-lieu')
  @ApiOperation({ summary: 'Lấy danh mục loại tài liệu' })
  getLoaiTaiLieu() {
    return this.danhMucService.getLoaiTaiLieu();
  }

  @Get('loai-thay-doi')
  @ApiOperation({ summary: 'Lấy danh mục loại thay đổi' })
  getLoaiThayDoi() {
    return this.danhMucService.getLoaiThayDoi();
  }
}
