import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { DanhMucService } from './danh-muc.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequirePermissions } from '../auth/decorators/roles.decorator';
import { CreateLoaiHoSoDto, UpdateLoaiHoSoDto, UpdateLoaiHoSoExpiryDto } from './dto/loai-ho-so.dto';

@ApiTags('Danh Mục')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('danh-muc')
export class DanhMucController {
  constructor(private readonly danhMucService: DanhMucService) {}

  @Get('loai-ho-so')
  @ApiOperation({ summary: 'Lấy danh mục loại hồ sơ' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  getLoaiHoSo(@Query('includeInactive') includeInactive?: string) {
    return this.danhMucService.getLoaiHoSo(includeInactive === 'true');
  }

  @Post('loai-ho-so')
  @ApiOperation({ summary: 'Thêm mới loại hồ sơ' })
  @RequirePermissions('DANH_MUC_CREATE', 'DANH_MUC_MANAGE')
  createLoaiHoSo(@Body() body: CreateLoaiHoSoDto) {
    return this.danhMucService.createLoaiHoSo(body);
  }

  @Put('loai-ho-so/:id')
  @ApiOperation({ summary: 'Cập nhật thông tin & cấu hình trường đặc thù loại hồ sơ' })
  @RequirePermissions('DANH_MUC_UPDATE', 'DANH_MUC_MANAGE')
  updateLoaiHoSo(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateLoaiHoSoDto,
  ) {
    return this.danhMucService.updateLoaiHoSo(id, body);
  }

  @Delete('loai-ho-so/:id')
  @ApiOperation({ summary: 'Xóa loại hồ sơ (chỉ khi chưa phát sinh hồ sơ và không phải loại mặc định)' })
  @RequirePermissions('DANH_MUC_DELETE', 'DANH_MUC_MANAGE')
  deleteLoaiHoSo(@Param('id', ParseIntPipe) id: number) {
    return this.danhMucService.deleteLoaiHoSo(id);
  }

  @Patch('loai-ho-so/:id/canh-bao-han')
  @ApiOperation({ summary: 'Cập nhật cấu hình cảnh báo hạn cho loại hồ sơ' })
  @RequirePermissions('DANH_MUC_UPDATE', 'DANH_MUC_MANAGE')
  updateLoaiHoSoExpiry(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateLoaiHoSoExpiryDto,
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
