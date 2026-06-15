import { Controller, Get, Post, Body, Put, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { HoSoService } from './ho-so.service';
import { CreateHoSoDto } from './dto/create-ho-so.dto';
import { UpdateHoSoDto } from './dto/update-ho-so.dto';
import { CapSoDto } from './dto/cap-so.dto';
import { GiaHanDto } from './dto/gia-han.dto';
import { ThayTheDto } from './dto/thay-the.dto';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Hồ Sơ')
@Controller('ho-so')
export class HoSoController {
  constructor(private readonly hoSoService: HoSoService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo mới hồ sơ' })
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
  update(@Param('id', ParseIntPipe) id: number, @Body() updateHoSoDto: UpdateHoSoDto) {
    return this.hoSoService.update(id, updateHoSoDto);
  }

  @Patch(':id/cap-so')
  @ApiOperation({ summary: 'Cấp số công bố cho hồ sơ' })
  capSo(@Param('id', ParseIntPipe) id: number, @Body() capSoDto: CapSoDto) {
    return this.hoSoService.capSo(id, capSoDto);
  }

  @Post(':id/gia-han')
  @ApiOperation({ summary: 'Gia hạn hồ sơ' })
  giaHan(@Param('id', ParseIntPipe) id: number, @Body() giaHanDto: GiaHanDto) {
    return this.hoSoService.giaHan(id, giaHanDto);
  }

  @Post(':id/thay-the')
  @ApiOperation({ summary: 'Thay thế hồ sơ (Đổi số công bố)' })
  thayThe(@Param('id', ParseIntPipe) id: number, @Body() thayTheDto: ThayTheDto) {
    return this.hoSoService.thayThe(id, thayTheDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa hồ sơ' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.hoSoService.remove(id);
  }
}
