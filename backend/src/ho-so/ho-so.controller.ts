import { Controller, Get, Post, Body, Put, Patch, Param, Delete, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { HoSoService } from './ho-so.service';
import { CreateHoSoDto } from './dto/create-ho-so.dto';
import { UpdateHoSoDto } from './dto/update-ho-so.dto';
import { CapSoDto } from './dto/cap-so.dto';
import { GiaHanDto } from './dto/gia-han.dto';
import { ThayTheDto } from './dto/thay-the.dto';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequireRole } from '../auth/decorators/roles.decorator';

@ApiTags('Hồ Sơ')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ho-so')
export class HoSoController {
  constructor(private readonly hoSoService: HoSoService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo mới hồ sơ' })
  @RequireRole({ department: 'Đăng ký' })
  create(@Body() createHoSoDto: CreateHoSoDto) {
    return this.hoSoService.create(createHoSoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách hồ sơ (có filter)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'loai_ho_so', required: false })
  @ApiQuery({ name: 'tinh_trang', required: false })
  @ApiQuery({ name: 'cong_ty_id', required: false })
  @ApiQuery({ name: 'ngay_het_han_from', required: false })
  @ApiQuery({ name: 'ngay_het_han_to', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Query() query: any) {
    return this.hoSoService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết hồ sơ' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.hoSoService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật hồ sơ' })
  @RequireRole({ department: 'Đăng ký', position: 'PT' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateHoSoDto: UpdateHoSoDto) {
    return this.hoSoService.update(id, updateHoSoDto);
  }

  @Patch(':id/cap-so')
  @ApiOperation({ summary: 'Cấp số công bố cho hồ sơ' })
  @RequireRole({ department: 'Đăng ký' })
  capSo(@Param('id', ParseIntPipe) id: number, @Body() capSoDto: CapSoDto) {
    return this.hoSoService.capSo(id, capSoDto);
  }

  @Post(':id/gia-han')
  @ApiOperation({ summary: 'Gia hạn hồ sơ' })
  @RequireRole({ department: 'Đăng ký' })
  giaHan(@Param('id', ParseIntPipe) id: number, @Body() giaHanDto: GiaHanDto) {
    return this.hoSoService.giaHan(id, giaHanDto);
  }

  @Post(':id/thay-the')
  @ApiOperation({ summary: 'Thay thế hồ sơ (Đổi số công bố)' })
  @RequireRole({ department: 'Đăng ký', position: 'PT' })
  thayThe(@Param('id', ParseIntPipe) id: number, @Body() thayTheDto: ThayTheDto) {
    return this.hoSoService.thayThe(id, thayTheDto);
  }

  @Post(':id/thay-doi')
  @ApiOperation({ summary: 'Thêm lịch sử thay đổi bổ sung' })
  @RequireRole({ department: 'Đăng ký' })
  thayDoi(@Param('id', ParseIntPipe) id: number, @Body() thayDoiDto: import('./dto/thay-doi.dto').ThayDoiDto) {
    return this.hoSoService.thayDoi(id, thayDoiDto);
  }

  @Patch(':id/lich-su-thay-doi/:lichSuId')
  @ApiOperation({ summary: 'Cập nhật lịch sử thay đổi' })
  @RequireRole({ department: 'Đăng ký' })
  updateLichSuThayDoi(
    @Param('id', ParseIntPipe) id: number,
    @Param('lichSuId', ParseIntPipe) lichSuId: number,
    @Body() thayDoiDto: import('./dto/thay-doi.dto').ThayDoiDto
  ) {
    return this.hoSoService.updateLichSuThayDoi(id, lichSuId, thayDoiDto);
  }

  @Delete(':id/lich-su-thay-doi/:lichSuId')
  @ApiOperation({ summary: 'Xóa lịch sử thay đổi' })
  @RequireRole({ department: 'Đăng ký' })
  deleteLichSuThayDoi(
    @Param('id', ParseIntPipe) id: number,
    @Param('lichSuId', ParseIntPipe) lichSuId: number
  ) {
    return this.hoSoService.deleteLichSuThayDoi(id, lichSuId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa hồ sơ' })
  @RequireRole({ department: 'Đăng ký', position: 'PT' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.hoSoService.remove(id);
  }

  @Post(':id/tai-lieu')
  @ApiOperation({ summary: 'Thêm tài liệu đính kèm khác' })
  @RequireRole({ department: 'Đăng ký' })
  addTaiLieu(@Param('id', ParseIntPipe) id: number, @Body() data: import('./dto/tai-lieu.dto').TaiLieuDto) {
    return this.hoSoService.addTaiLieu(id, data);
  }

  @Delete(':id/tai-lieu/:taiLieuId')
  @ApiOperation({ summary: 'Xóa tài liệu đính kèm khác' })
  @RequireRole({ department: 'Đăng ký' })
  deleteTaiLieu(
    @Param('id', ParseIntPipe) id: number,
    @Param('taiLieuId', ParseIntPipe) taiLieuId: number
  ) {
    return this.hoSoService.deleteTaiLieu(id, taiLieuId);
  }
}
