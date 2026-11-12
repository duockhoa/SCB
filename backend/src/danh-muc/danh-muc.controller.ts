import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { DanhMucService } from './danh-muc.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequirePermissions } from '../auth/decorators/roles.decorator';
import { CreateLoaiHoSoDto, UpdateLoaiHoSoDto, UpdateLoaiHoSoExpiryDto } from './dto/loai-ho-so.dto';
import { CreateLoaiTaiLieuDto, UpdateLoaiTaiLieuDto } from './dto/loai-tai-lieu.dto';

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
  @ApiOperation({ summary: 'Lấy danh mục loại tài liệu (hỗ trợ lọc theo loại hồ sơ)' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiQuery({ name: 'loaiHoSoId', required: false, type: Number })
  getLoaiTaiLieu(
    @Query('includeInactive') includeInactive?: string,
    @Query('loaiHoSoId') loaiHoSoId?: string,
  ) {
    const parsedLoaiHoSoId = loaiHoSoId && Number(loaiHoSoId) > 0 ? Number(loaiHoSoId) : undefined;
    return this.danhMucService.getLoaiTaiLieu(includeInactive === 'true', parsedLoaiHoSoId);
  }

  @Post('loai-tai-lieu')
  @ApiOperation({ summary: 'Thêm mới loại tài liệu' })
  @RequirePermissions('DANH_MUC_CREATE', 'DANH_MUC_MANAGE')
  createLoaiTaiLieu(@Body() body: CreateLoaiTaiLieuDto) {
    return this.danhMucService.createLoaiTaiLieu(body);
  }

  @Put('loai-tai-lieu/:id')
  @ApiOperation({ summary: 'Cập nhật loại tài liệu, phạm vi loại hồ sơ & cấu hình trường động' })
  @RequirePermissions('DANH_MUC_UPDATE', 'DANH_MUC_MANAGE')
  updateLoaiTaiLieu(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateLoaiTaiLieuDto,
  ) {
    return this.danhMucService.updateLoaiTaiLieu(id, body);
  }

  @Delete('loai-tai-lieu/:id')
  @ApiOperation({ summary: 'Xóa loại tài liệu (khi chưa có tài liệu sử dụng và không phải loại hệ thống)' })
  @RequirePermissions('DANH_MUC_DELETE', 'DANH_MUC_MANAGE')
  deleteLoaiTaiLieu(@Param('id', ParseIntPipe) id: number) {
    return this.danhMucService.deleteLoaiTaiLieu(id);
  }

  @Get('loai-thay-doi')
  @ApiOperation({ summary: 'Lấy danh mục loại thay đổi' })
  getLoaiThayDoi() {
    return this.danhMucService.getLoaiThayDoi();
  }
}
