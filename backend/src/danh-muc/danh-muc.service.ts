import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EXPIRY_STATUSES, expiryStatus, reminderDate, todayInVietnam, ExpiryConfig } from '../ho-so/expiry';
import {
  CreateLoaiHoSoDto,
  CustomFieldConfigDto,
  UpdateLoaiHoSoDto,
  UpdateLoaiHoSoExpiryDto,
} from './dto/loai-ho-so.dto';

export const SYSTEM_LOAI_HO_SO_CODES = new Set([
  'THUOC',
  'MY_PHAM',
  'TBYT',
  'TPBVSK_TU_CONG_BO',
  'TPBVSK_CONG_BO',
  'CFS_CPP',
]);

const RESERVED_FIELD_KEYS = new Set(['id', 'ho_so_chung_id']);

@Injectable()
export class DanhMucService {
  constructor(private prisma: PrismaService) {}

  private formatLoaiHoSo<T extends { ma_loai: string; _count?: { ho_so_chung: number } }>(item: T) {
    const { _count, ...rest } = item;
    return {
      ...rest,
      is_system: SYSTEM_LOAI_HO_SO_CODES.has(item.ma_loai),
      so_luong_ho_so: _count?.ho_so_chung ?? 0,
    };
  }

  private normalizeCode(maLoai: string): string {
    const normalized = maLoai.trim().toUpperCase();
    if (!/^[A-Z0-9_]+$/.test(normalized)) {
      throw new BadRequestException('Mã loại hồ sơ chỉ được chứa chữ in hoa không dấu (A-Z), số (0-9) và dấu gạch dưới (_)');
    }
    return normalized;
  }

  private normalizeCustomFields(fields?: CustomFieldConfigDto[] | null) {
    if (!fields || fields.length === 0) return [];
    const seenKeys = new Set<string>();
    return fields.map((field) => {
      const key = field.key.trim();
      if (RESERVED_FIELD_KEYS.has(key)) {
        throw new BadRequestException(`Mã trường "${key}" là từ khóa hệ thống, vui lòng chọn mã khác`);
      }
      if (seenKeys.has(key)) {
        throw new BadRequestException(`Mã trường "${key}" bị trùng lặp`);
      }
      seenKeys.add(key);

      const options = field.type === 'select'
        ? (field.options || []).map((o) => o.trim()).filter(Boolean)
        : undefined;
      if (field.type === 'select' && (!options || options.length === 0)) {
        throw new BadRequestException(`Trường "${field.label}" (Danh sách chọn) phải có ít nhất 1 lựa chọn`);
      }

      return {
        key,
        label: field.label.trim(),
        type: field.type,
        required: Boolean(field.required),
        placeholder: field.placeholder?.trim() || undefined,
        ...(options ? { options } : {}),
        colSpan: field.colSpan ?? (field.type === 'textarea' || field.type === 'file' ? 24 : 12),
      };
    });
  }

  async getLoaiHoSo(includeInactive = false) {
    const items = await this.prisma.dm_loai_ho_so.findMany({
      where: includeInactive ? undefined : { trang_thai: true },
      include: { _count: { select: { ho_so_chung: true } } },
      orderBy: [{ thu_tu: 'asc' }, { id: 'asc' }],
    });
    return items.map((item) => this.formatLoaiHoSo(item));
  }

  async createLoaiHoSo(dto: CreateLoaiHoSoDto) {
    const ma_loai = this.normalizeCode(dto.ma_loai);
    const ten_loai = dto.ten_loai.trim();
    if (!ten_loai) {
      throw new BadRequestException('Tên loại hồ sơ không được để trống');
    }

    const exists = await this.prisma.dm_loai_ho_so.findUnique({ where: { ma_loai } });
    if (exists) {
      throw new ConflictException(`Mã loại hồ sơ "${ma_loai}" đã tồn tại`);
    }

    const cau_hinh_truong = this.normalizeCustomFields(dto.cau_hinh_truong);
    let thu_tu = dto.thu_tu;
    if (thu_tu === undefined) {
      const agg = await this.prisma.dm_loai_ho_so.aggregate({ _max: { thu_tu: true } });
      thu_tu = (agg._max.thu_tu ?? 0) + 1;
    }

    const created = await this.prisma.dm_loai_ho_so.create({
      data: {
        ma_loai,
        ten_loai,
        mo_ta: dto.mo_ta?.trim() || null,
        mau_sac: dto.mau_sac?.trim() || null,
        thu_tu,
        trang_thai: dto.trang_thai ?? true,
        thoi_gian_canh_bao: dto.thoi_gian_canh_bao ?? 6,
        don_vi_canh_bao: (dto.don_vi_canh_bao || 'THANG').toUpperCase(),
        cau_hinh_truong: cau_hinh_truong as unknown as Prisma.InputJsonValue,
      },
      include: { _count: { select: { ho_so_chung: true } } },
    });

    return this.formatLoaiHoSo(created);
  }

  async updateLoaiHoSo(id: number, dto: UpdateLoaiHoSoDto) {
    const existing = await this.prisma.dm_loai_ho_so.findUnique({
      where: { id },
      include: { _count: { select: { ho_so_chung: true } } },
    });
    if (!existing) throw new NotFoundException('Không tìm thấy loại hồ sơ');

    let nextMaLoai: string | undefined;
    if (dto.ma_loai !== undefined) {
      const normalized = this.normalizeCode(dto.ma_loai);
      if (normalized !== existing.ma_loai) {
        if (SYSTEM_LOAI_HO_SO_CODES.has(existing.ma_loai)) {
          throw new BadRequestException('Không thể thay đổi mã loại của loại hồ sơ mặc định hệ thống');
        }
        if (existing._count.ho_so_chung > 0) {
          throw new BadRequestException('Không thể thay đổi mã loại khi đã có hồ sơ sử dụng');
        }
        const dup = await this.prisma.dm_loai_ho_so.findFirst({
          where: { ma_loai: normalized, id: { not: id } },
        });
        if (dup) throw new ConflictException(`Mã loại hồ sơ "${normalized}" đã tồn tại`);
        nextMaLoai = normalized;
      }
    }

    let nextTenLoai: string | undefined;
    if (dto.ten_loai !== undefined) {
      nextTenLoai = dto.ten_loai.trim();
      if (!nextTenLoai) {
        throw new BadRequestException('Tên loại hồ sơ không được để trống');
      }
    }

    const cau_hinh_truong = dto.cau_hinh_truong !== undefined
      ? (this.normalizeCustomFields(dto.cau_hinh_truong) as unknown as Prisma.InputJsonValue)
      : undefined;

    const updated = await this.prisma.dm_loai_ho_so.update({
      where: { id },
      data: {
        ...(nextMaLoai !== undefined ? { ma_loai: nextMaLoai } : {}),
        ...(nextTenLoai !== undefined ? { ten_loai: nextTenLoai } : {}),
        ...(dto.mo_ta !== undefined ? { mo_ta: dto.mo_ta?.trim() || null } : {}),
        ...(dto.mau_sac !== undefined ? { mau_sac: dto.mau_sac?.trim() || null } : {}),
        ...(dto.thu_tu !== undefined ? { thu_tu: dto.thu_tu } : {}),
        ...(dto.trang_thai !== undefined ? { trang_thai: dto.trang_thai } : {}),
        ...(dto.thoi_gian_canh_bao !== undefined ? { thoi_gian_canh_bao: dto.thoi_gian_canh_bao } : {}),
        ...(dto.don_vi_canh_bao !== undefined ? { don_vi_canh_bao: dto.don_vi_canh_bao.toUpperCase() } : {}),
        ...(cau_hinh_truong !== undefined ? { cau_hinh_truong } : {}),
      },
      include: { _count: { select: { ho_so_chung: true } } },
    });

    return this.formatLoaiHoSo(updated);
  }

  async deleteLoaiHoSo(id: number) {
    const existing = await this.prisma.dm_loai_ho_so.findUnique({
      where: { id },
      include: { _count: { select: { ho_so_chung: true } } },
    });
    if (!existing) throw new NotFoundException('Không tìm thấy loại hồ sơ');

    if (SYSTEM_LOAI_HO_SO_CODES.has(existing.ma_loai)) {
      throw new BadRequestException(
        'Không thể xóa loại hồ sơ mặc định của hệ thống. Bạn có thể đổi tên hoặc chuyển sang Ngưng hoạt động.',
      );
    }

    if (existing._count.ho_so_chung > 0) {
      throw new ConflictException(
        `Không thể xóa loại hồ sơ đang được sử dụng bởi ${existing._count.ho_so_chung} hồ sơ. Vui lòng chuyển sang trạng thái Ngưng hoạt động.`,
      );
    }

    await this.prisma.dm_loai_ho_so.delete({ where: { id } });
    return { message: 'Xóa loại hồ sơ thành công' };
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

  async updateLoaiHoSoExpiry(id: number, data: UpdateLoaiHoSoExpiryDto) {
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
