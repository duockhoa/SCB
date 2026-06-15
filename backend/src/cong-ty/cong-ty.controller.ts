import { Controller, Get, Post, Body, Put, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { CongTyService } from './cong-ty.service';
import { CreateCongTyDto } from './dto/create-cong-ty.dto';
import { UpdateCongTyDto } from './dto/update-cong-ty.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Công Ty')
@Controller('cong-ty')
export class CongTyController {
  constructor(private readonly congTyService: CongTyService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo mới công ty' })
  create(@Body() createCongTyDto: CreateCongTyDto) {
    return this.congTyService.create(createCongTyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách công ty' })
  findAll() {
    return this.congTyService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết công ty' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.congTyService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật công ty' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCongTyDto: UpdateCongTyDto) {
    return this.congTyService.update(id, updateCongTyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa công ty' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.congTyService.remove(id);
  }
}
