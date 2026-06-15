import { Controller, Get } from '@nestjs/common';
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
