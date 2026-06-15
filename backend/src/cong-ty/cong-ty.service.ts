import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCongTyDto } from './dto/create-cong-ty.dto';
import { UpdateCongTyDto } from './dto/update-cong-ty.dto';

@Injectable()
export class CongTyService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.dm_cong_ty.findMany({
      orderBy: { created_at: 'desc' }
    });
  }

  async findOne(id: number) {
    const congTy = await this.prisma.dm_cong_ty.findUnique({ where: { id } });
    if (!congTy) throw new NotFoundException('Không tìm thấy công ty');
    return congTy;
  }

  async create(data: CreateCongTyDto) {
    const exists = await this.prisma.dm_cong_ty.findUnique({
      where: { ma_cong_ty: data.ma_cong_ty }
    });
    if (exists) throw new ConflictException('Mã công ty đã tồn tại');

    return this.prisma.dm_cong_ty.create({ data });
  }

  async update(id: number, data: UpdateCongTyDto) {
    await this.findOne(id);
    
    if (data.ma_cong_ty) {
        const exists = await this.prisma.dm_cong_ty.findFirst({
            where: { ma_cong_ty: data.ma_cong_ty, id: { not: id } }
        });
        if (exists) throw new ConflictException('Mã công ty đã tồn tại');
    }

    return this.prisma.dm_cong_ty.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    
    const usage = await this.prisma.ho_so_chung.findFirst({
      where: {
        OR: [
          { cong_ty_so_huu_id: id },
          { cong_ty_dung_ten_id: id },
          { cong_ty_phan_phoi_id: id },
        ]
      }
    });

    if (usage) {
      throw new ConflictException('Không thể xóa công ty đã được sử dụng trong hồ sơ. Hãy đổi trạng thái thành Không hoạt động.');
    }

    await this.prisma.dm_cong_ty.delete({ where: { id } });
    return { message: 'Xóa thành công' };
  }
}
