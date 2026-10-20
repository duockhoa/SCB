import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EXPIRY_STATUSES, expiryStatus, reminderDate, todayInVietnam, ExpiryConfig } from '../ho-so/expiry';

@Injectable()
export class DanhMucService {
  constructor(private prisma: PrismaService) {}

  async getLoaiHoSo() {
    return this.prisma.dm_loai_ho_so.findMany({
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

  async updateLoaiHoSoExpiry(
    id: number,
    data: { thoi_gian_canh_bao: number; don_vi_canh_bao?: string; dong_bo_tat_ca?: boolean }
  ) {
    const loai = await this.prisma.dm_loai_ho_so.findUnique({ where: { id } });
    if (!loai) throw new NotFoundException('Không tìm thấy loại hồ sơ');

    const donVi = (data.don_vi_canh_bao || 'THANG').toUpperCase();
    const thoiGian = Number(data.thoi_gian_canh_bao);
    if (Number.isNaN(thoiGian) || thoiGian <= 0) {
      throw new BadRequestException('Thời gian cảnh báo phải là số nguyên dương');
    }

    const updated = await this.prisma.dm_loai_ho_so.update({
      where: { id },
      data: {
        thoi_gian_canh_bao: thoiGian,
        don_vi_canh_bao: donVi,
      },
    });

    let syncCount = 0;
    if (data.dong_bo_tat_ca) {
      const today = todayInVietnam();
      const config: ExpiryConfig = { value: thoiGian, unit: donVi };
      const statuses = await this.prisma.dm_tinh_trang.findMany({
        where: { ma_tinh_trang: { in: EXPIRY_STATUSES } },
      });
      const ids = new Map(statuses.map((s) => [s.ma_tinh_trang, s.id]));

      const dossiers = await this.prisma.ho_so_chung.findMany({
        where: {
          loai_ho_so_id: id,
          ngay_het_han: { not: null },
          tinh_trang_id: { in: [...ids.values()] },
        },
        select: {
          id: true,
          ngay_het_han: true,
          tinh_trang_id: true,
          ngay_nhac_han: true,
          ap_dung_quy_dinh_tam_thoi: true,
          ngay_het_han_quy_dinh: true,
        },
      });

      for (const d of dossiers) {
        const effective = (d.ap_dung_quy_dinh_tam_thoi && d.ngay_het_han_quy_dinh)
          ? d.ngay_het_han_quy_dinh
          : d.ngay_het_han;
        const nextCode = expiryStatus(effective, config, today);
        const nextId = ids.get(nextCode);
        const nextReminder = reminderDate(effective, config);

        if (d.tinh_trang_id !== nextId || d.ngay_nhac_han?.getTime() !== nextReminder?.getTime()) {
          await this.prisma.ho_so_chung.update({
            where: { id: d.id },
            data: {
              tinh_trang_id: nextId,
              ngay_nhac_han: nextReminder,
            },
          });
          syncCount++;
        }
      }
    }

    return { ...updated, syncCount };
  }
}
