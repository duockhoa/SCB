import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DanhMucService {
  constructor(private prisma: PrismaService) {}

  async getLoaiHoSo() {
    return this.prisma.dm_loai_ho_so.findMany({
      where: { trang_thai: true },
      orderBy: { thu_tu: 'asc' },
    });
  }

  async getTinhTrang() {
    return this.prisma.dm_tinh_trang.findMany({
      orderBy: { thu_tu: 'asc' },
    });
  }

  async getLoaiTaiLieu() {
    return this.prisma.dm_loai_tai_lieu.findMany({
      where: { trang_thai: true },
      orderBy: { thu_tu: 'asc' },
    });
  }

  async getLoaiThayDoi() {
    return this.prisma.dm_loai_thay_doi.findMany();
  }
}
