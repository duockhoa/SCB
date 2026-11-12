import { Injectable, NotFoundException, BadRequestException, ConflictException, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EXPIRY_STATUSES, expiryStatus, reminderDate, todayInVietnam, ExpiryConfig } from '../ho-so/expiry';
import {
  CreateLoaiHoSoDto,
  CustomFieldConfigDto,
  UpdateLoaiHoSoDto,
  UpdateLoaiHoSoExpiryDto,
} from './dto/loai-ho-so.dto';
import {
  CreateLoaiTaiLieuDto,
  UpdateLoaiTaiLieuDto,
} from './dto/loai-tai-lieu.dto';
import {
  CreateNhomTaiLieuDto,
  UpdateNhomTaiLieuDto,
} from './dto/nhom-tai-lieu.dto';

export const SYSTEM_LOAI_HO_SO_CODES = new Set([
  'THUOC',
  'MY_PHAM',
  'TBYT',
  'TPBVSK_TU_CONG_BO',
  'TPBVSK_CONG_BO',
  'CFS_CPP',
]);

export const SYSTEM_NHOM_TAI_LIEU_CODES = new Set([
  'TAI_LIEU_CHUNG',
  'TAI_LIEU_DAC_THU',
]);

export const SYSTEM_LOAI_TAI_LIEU_CODES = new Set(['KHAC']);

const RESERVED_FIELD_KEYS = new Set(['id', 'ho_so_chung_id']);

@Injectable()
export class DanhMucService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureDefaultNhomTaiLieu().catch(() => undefined);
  }

  async ensureDefaultNhomTaiLieu() {
    if (!this.prisma?.dm_nhom_tai_lieu?.upsert) return;
    const chung = await this.prisma.dm_nhom_tai_lieu.upsert({
      where: { ma_nhom: 'TAI_LIEU_CHUNG' },
      update: {},
      create: {
        ma_nhom: 'TAI_LIEU_CHUNG',
        ten_nhom: 'Tài liệu chung',
        mo_ta: 'Nhóm tài liệu pháp lý / tiêu chuẩn dùng chung cho hồ sơ',
        mau_sac: 'blue',
        thu_tu: 1,
        trang_thai: true,
        ap_dung_tat_ca: true,
      },
    });
    const dacThu = await this.prisma.dm_nhom_tai_lieu.upsert({
      where: { ma_nhom: 'TAI_LIEU_DAC_THU' },
      update: {},
      create: {
        ma_nhom: 'TAI_LIEU_DAC_THU',
        ten_nhom: 'Tài liệu đặc thù',
        mo_ta: 'Nhóm tài liệu chuyên ngành / đặc thù theo từng loại hồ sơ',
        mau_sac: 'purple',
        thu_tu: 2,
        trang_thai: true,
        ap_dung_tat_ca: true,
      },
    });

    if (this.prisma.dm_loai_tai_lieu?.updateMany) {
      await this.prisma.dm_loai_tai_lieu.updateMany({
        where: {
          nhom_tai_lieu_id: null,
          ma_loai_tai_lieu: { in: ['PHIEU_CONG_BO', 'NHAN', 'HDSD', 'QUANG_CAO', 'CFS', 'CPP'] },
        },
        data: { nhom_tai_lieu_id: dacThu.id },
      });
      await this.prisma.dm_loai_tai_lieu.updateMany({
        where: { nhom_tai_lieu_id: null },
        data: { nhom_tai_lieu_id: chung.id },
      });
    }
  }

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

  private formatLoaiTaiLieu<
    T extends {
      ma_loai_tai_lieu: string;
      nhom_tai_lieu?: { id: number; ma_nhom: string; ten_nhom: string; mau_sac: string | null } | null;
      _count?: { tai_lieu_ho_so: number };
      loai_ho_so_links?: Array<{
        loai_ho_so_id: number;
        loai_ho_so: { id: number; ma_loai: string; ten_loai: string; mau_sac: string | null };
      }>;
    },
  >(item: T) {
    const { _count, loai_ho_so_links, ...rest } = item;
    const links = loai_ho_so_links || [];
    return {
      ...rest,
      is_system: SYSTEM_LOAI_TAI_LIEU_CODES.has(item.ma_loai_tai_lieu),
      so_luong_tai_lieu: _count?.tai_lieu_ho_so ?? 0,
      loai_ho_so_ids: links.map((l) => l.loai_ho_so_id),
      loai_ho_so_list: links.map((l) => l.loai_ho_so),
    };
  }

  private formatNhomTaiLieu<
    T extends {
      ma_nhom: string;
      _count?: { loai_tai_lieu: number };
      loai_ho_so_links?: Array<{
        loai_ho_so_id: number;
        loai_ho_so: { id: number; ma_loai: string; ten_loai: string; mau_sac: string | null };
      }>;
      loai_tai_lieu?: Array<any>;
    },
  >(item: T) {
    const { _count, loai_ho_so_links, loai_tai_lieu, ...rest } = item;
    const links = loai_ho_so_links || [];
    const formattedTypes = (loai_tai_lieu || []).map((t) => this.formatLoaiTaiLieu(t));
    return {
      ...rest,
      is_system: SYSTEM_NHOM_TAI_LIEU_CODES.has(item.ma_nhom),
      so_luong_loai_tai_lieu: _count?.loai_tai_lieu ?? formattedTypes.length,
      loai_ho_so_ids: links.map((l) => l.loai_ho_so_id),
      loai_ho_so_list: links.map((l) => l.loai_ho_so),
      ...(loai_tai_lieu ? { loai_tai_lieu: formattedTypes } : {}),
    };
  }

  private readonly nhomTaiLieuInclude = (includeInactive: boolean, loaiHoSoId?: number) => ({
    _count: { select: { loai_tai_lieu: true } },
    loai_ho_so_links: {
      include: {
        loai_ho_so: {
          select: { id: true, ma_loai: true, ten_loai: true, mau_sac: true },
        },
      },
      orderBy: [{ thu_tu: 'asc' as const }, { loai_ho_so_id: 'asc' as const }],
    },
    loai_tai_lieu: {
      where: {
        ...(includeInactive ? {} : { trang_thai: true }),
        ...(loaiHoSoId
          ? {
              OR: [
                { ap_dung_tat_ca: true },
                { loai_ho_so_links: { some: { loai_ho_so_id: loaiHoSoId } } },
              ],
            }
          : {}),
      },
      include: {
        _count: { select: { tai_lieu_ho_so: true } },
        loai_ho_so_links: {
          include: {
            loai_ho_so: {
              select: { id: true, ma_loai: true, ten_loai: true, mau_sac: true },
            },
          },
          orderBy: [{ thu_tu: 'asc' as const }, { loai_ho_so_id: 'asc' as const }],
        },
      },
      orderBy: [{ thu_tu: 'asc' as const }, { id: 'asc' as const }],
    },
  });

  async getNhomTaiLieu(includeInactive = false, loaiHoSoId?: number) {
    const where: Prisma.dm_nhom_tai_lieuWhereInput = {
      ...(includeInactive ? {} : { trang_thai: true }),
      ...(loaiHoSoId
        ? {
            OR: [
              { ap_dung_tat_ca: true },
              { loai_ho_so_links: { some: { loai_ho_so_id: loaiHoSoId } } },
            ],
          }
        : {}),
    };

    const groups = await this.prisma.dm_nhom_tai_lieu.findMany({
      where,
      include: this.nhomTaiLieuInclude(includeInactive, loaiHoSoId),
      orderBy: [{ thu_tu: 'asc' }, { id: 'asc' }],
    });

    return groups.map((g) => this.formatNhomTaiLieu(g));
  }

  async createNhomTaiLieu(dto: CreateNhomTaiLieuDto) {
    const ma_nhom = this.normalizeCode(dto.ma_nhom);
    const ten_nhom = dto.ten_nhom.trim();
    if (!ten_nhom) {
      throw new BadRequestException('Tên nhóm tài liệu không được để trống');
    }

    const exists = await this.prisma.dm_nhom_tai_lieu.findUnique({ where: { ma_nhom } });
    if (exists) {
      throw new ConflictException(`Mã nhóm tài liệu "${ma_nhom}" đã tồn tại`);
    }

    const apDungTatCa = dto.ap_dung_tat_ca ?? true;
    const validLoaiHoSoIds = apDungTatCa ? [] : await this.validateLoaiHoSoIds(dto.loai_ho_so_ids);
    if (!apDungTatCa && validLoaiHoSoIds.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất 1 loại hồ sơ áp dụng hoặc bật "Áp dụng tất cả"');
    }

    let thu_tu = dto.thu_tu;
    if (thu_tu === undefined) {
      const agg = await this.prisma.dm_nhom_tai_lieu.aggregate({ _max: { thu_tu: true } });
      thu_tu = (agg._max.thu_tu ?? 0) + 1;
    }

    const created = await this.prisma.dm_nhom_tai_lieu.create({
      data: {
        ma_nhom,
        ten_nhom,
        mo_ta: dto.mo_ta?.trim() || null,
        mau_sac: dto.mau_sac?.trim() || null,
        thu_tu,
        trang_thai: dto.trang_thai ?? true,
        ap_dung_tat_ca: apDungTatCa,
        ...(validLoaiHoSoIds.length > 0
          ? {
              loai_ho_so_links: {
                create: validLoaiHoSoIds.map((loai_ho_so_id, idx) => ({
                  loai_ho_so_id,
                  thu_tu: idx,
                })),
              },
            }
          : {}),
      },
      include: this.nhomTaiLieuInclude(true),
    });

    return this.formatNhomTaiLieu(created);
  }

  async updateNhomTaiLieu(id: number, dto: UpdateNhomTaiLieuDto) {
    const existing = await this.prisma.dm_nhom_tai_lieu.findUnique({
      where: { id },
      include: {
        _count: { select: { loai_tai_lieu: true } },
        loai_ho_so_links: true,
      },
    });
    if (!existing) throw new NotFoundException('Không tìm thấy nhóm tài liệu');

    let nextMaNhom: string | undefined;
    if (dto.ma_nhom !== undefined) {
      const normalized = this.normalizeCode(dto.ma_nhom);
      if (normalized !== existing.ma_nhom) {
        if (SYSTEM_NHOM_TAI_LIEU_CODES.has(existing.ma_nhom)) {
          throw new BadRequestException('Không thể thay đổi mã của nhóm tài liệu mặc định hệ thống');
        }
        const dup = await this.prisma.dm_nhom_tai_lieu.findFirst({
          where: { ma_nhom: normalized, id: { not: id } },
        });
        if (dup) throw new ConflictException(`Mã nhóm tài liệu "${normalized}" đã tồn tại`);
        nextMaNhom = normalized;
      }
    }

    let nextTenNhom: string | undefined;
    if (dto.ten_nhom !== undefined) {
      nextTenNhom = dto.ten_nhom.trim();
      if (!nextTenNhom) {
        throw new BadRequestException('Tên nhóm tài liệu không được để trống');
      }
    }

    const nextApDungTatCa = dto.ap_dung_tat_ca ?? existing.ap_dung_tat_ca;
    const shouldReplaceLinks = dto.ap_dung_tat_ca !== undefined || dto.loai_ho_so_ids !== undefined;
    let nextLoaiHoSoIds: number[] = [];

    if (!nextApDungTatCa) {
      const rawIds =
        dto.loai_ho_so_ids !== undefined
          ? dto.loai_ho_so_ids
          : existing.loai_ho_so_links.map((l) => l.loai_ho_so_id);
      nextLoaiHoSoIds = await this.validateLoaiHoSoIds(rawIds);
      if (nextLoaiHoSoIds.length === 0) {
        throw new BadRequestException('Vui lòng chọn ít nhất 1 loại hồ sơ áp dụng hoặc bật "Áp dụng tất cả"');
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (shouldReplaceLinks) {
        await tx.dm_loai_ho_so_nhom_tai_lieu.deleteMany({ where: { nhom_tai_lieu_id: id } });
        if (!nextApDungTatCa && nextLoaiHoSoIds.length > 0) {
          await tx.dm_loai_ho_so_nhom_tai_lieu.createMany({
            data: nextLoaiHoSoIds.map((loai_ho_so_id, idx) => ({
              loai_ho_so_id,
              nhom_tai_lieu_id: id,
              thu_tu: idx,
            })),
          });
        }
      }

      if (nextMaNhom && nextMaNhom !== existing.ma_nhom) {
        await this.syncTaiLieuGroupPermissionCodes(tx, existing.ma_nhom, nextMaNhom);
      }

      return tx.dm_nhom_tai_lieu.update({
        where: { id },
        data: {
          ...(nextMaNhom !== undefined ? { ma_nhom: nextMaNhom } : {}),
          ...(nextTenNhom !== undefined ? { ten_nhom: nextTenNhom } : {}),
          ...(dto.mo_ta !== undefined ? { mo_ta: dto.mo_ta?.trim() || null } : {}),
          ...(dto.mau_sac !== undefined ? { mau_sac: dto.mau_sac?.trim() || null } : {}),
          ...(dto.thu_tu !== undefined ? { thu_tu: dto.thu_tu } : {}),
          ...(dto.trang_thai !== undefined ? { trang_thai: dto.trang_thai } : {}),
          ...(dto.ap_dung_tat_ca !== undefined ? { ap_dung_tat_ca: dto.ap_dung_tat_ca } : {}),
        },
        include: this.nhomTaiLieuInclude(true),
      });
    });

    return this.formatNhomTaiLieu(updated);
  }

  async deleteNhomTaiLieu(id: number) {
    const existing = await this.prisma.dm_nhom_tai_lieu.findUnique({
      where: { id },
      include: { _count: { select: { loai_tai_lieu: true } } },
    });
    if (!existing) throw new NotFoundException('Không tìm thấy nhóm tài liệu');

    if (SYSTEM_NHOM_TAI_LIEU_CODES.has(existing.ma_nhom)) {
      throw new BadRequestException(
        'Không thể xóa nhóm tài liệu mặc định hệ thống. Bạn có thể đổi tên hoặc chuyển sang Ngưng hoạt động.',
      );
    }

    if (existing._count.loai_tai_lieu > 0) {
      throw new ConflictException(
        `Không thể xóa nhóm đang chứa ${existing._count.loai_tai_lieu} loại tài liệu. Vui lòng chuyển các loại tài liệu sang nhóm khác trước hoặc chuyển nhóm sang Ngưng hoạt động.`,
      );
    }

    await this.prisma.dm_nhom_tai_lieu.delete({ where: { id } });
    await this.syncTaiLieuGroupPermissionCodes(this.prisma, existing.ma_nhom, null);
    return { message: 'Xóa nhóm tài liệu thành công' };
  }

  private async validateNhomTaiLieuId(nhomTaiLieuId?: number | null): Promise<number | null | undefined> {
    if (nhomTaiLieuId === undefined) return undefined;
    if (nhomTaiLieuId === null) return null;
    if (!this.prisma.dm_nhom_tai_lieu?.findUnique) return nhomTaiLieuId;
    const found = await this.prisma.dm_nhom_tai_lieu.findUnique({
      where: { id: nhomTaiLieuId },
      select: { id: true },
    });
    if (!found) {
      throw new BadRequestException('Nhóm tài liệu được chọn không tồn tại');
    }
    return found.id;
  }

  private async validateLoaiHoSoIds(loaiHoSoIds?: number[]): Promise<number[]> {
    const uniqueIds = Array.from(new Set((loaiHoSoIds || []).map(Number).filter((n) => Number.isInteger(n) && n > 0)));
    if (uniqueIds.length === 0) return [];
    const found = await this.prisma.dm_loai_ho_so.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });
    if (found.length !== uniqueIds.length) {
      throw new BadRequestException('Một hoặc nhiều loại hồ sơ được chọn không tồn tại');
    }
    return uniqueIds;
  }

  async getLoaiTaiLieu(includeInactive = false, loaiHoSoId?: number) {
    const where: Prisma.dm_loai_tai_lieuWhereInput = {
      ...(includeInactive ? {} : { trang_thai: true }),
      ...(loaiHoSoId
        ? {
            OR: [
              { ap_dung_tat_ca: true },
              { loai_ho_so_links: { some: { loai_ho_so_id: loaiHoSoId } } },
            ],
          }
        : {}),
    };

    const items = await this.prisma.dm_loai_tai_lieu.findMany({
      where,
      include: {
        nhom_tai_lieu: {
          select: { id: true, ma_nhom: true, ten_nhom: true, mau_sac: true },
        },
        _count: { select: { tai_lieu_ho_so: true } },
        loai_ho_so_links: {
          include: {
            loai_ho_so: {
              select: { id: true, ma_loai: true, ten_loai: true, mau_sac: true },
            },
          },
          orderBy: [{ thu_tu: 'asc' }, { loai_ho_so_id: 'asc' }],
        },
      },
      orderBy: [{ thu_tu: 'asc' }, { id: 'asc' }],
    });

    return items.map((item) => this.formatLoaiTaiLieu(item));
  }

  async createLoaiTaiLieu(dto: CreateLoaiTaiLieuDto) {
    const ma_loai_tai_lieu = this.normalizeCode(dto.ma_loai_tai_lieu);
    const ten_loai_tai_lieu = dto.ten_loai_tai_lieu.trim();
    if (!ten_loai_tai_lieu) {
      throw new BadRequestException('Tên loại tài liệu không được để trống');
    }

    const exists = await this.prisma.dm_loai_tai_lieu.findUnique({ where: { ma_loai_tai_lieu } });
    if (exists) {
      throw new ConflictException(`Mã loại tài liệu "${ma_loai_tai_lieu}" đã tồn tại`);
    }

    const validNhomId = await this.validateNhomTaiLieuId(dto.nhom_tai_lieu_id);
    let resolvedNhomId = validNhomId ?? null;
    if (resolvedNhomId === null && dto.nhom_tai_lieu_id === undefined && this.prisma.dm_nhom_tai_lieu?.findUnique) {
      const defaultGroup = await this.prisma.dm_nhom_tai_lieu.findUnique({
        where: { ma_nhom: 'TAI_LIEU_CHUNG' },
        select: { id: true },
      });
      resolvedNhomId = defaultGroup?.id ?? null;
    }

    const apDungTatCa = dto.ap_dung_tat_ca ?? true;
    const validLoaiHoSoIds = apDungTatCa ? [] : await this.validateLoaiHoSoIds(dto.loai_ho_so_ids);
    if (!apDungTatCa && validLoaiHoSoIds.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất 1 loại hồ sơ áp dụng hoặc bật "Áp dụng tất cả"');
    }

    const cau_hinh_truong = this.normalizeCustomFields(dto.cau_hinh_truong);
    let thu_tu = dto.thu_tu;
    if (thu_tu === undefined) {
      const agg = await this.prisma.dm_loai_tai_lieu.aggregate({ _max: { thu_tu: true } });
      thu_tu = (agg._max.thu_tu ?? 0) + 1;
    }

    const created = await this.prisma.dm_loai_tai_lieu.create({
      data: {
        ma_loai_tai_lieu,
        ten_loai_tai_lieu,
        ...(resolvedNhomId ? { nhom_tai_lieu_id: resolvedNhomId } : {}),
        mo_ta: dto.mo_ta?.trim() || null,
        mau_sac: dto.mau_sac?.trim() || null,
        thu_tu,
        trang_thai: dto.trang_thai ?? true,
        ap_dung_tat_ca: apDungTatCa,
        cau_hinh_truong: cau_hinh_truong as unknown as Prisma.InputJsonValue,
        ...(validLoaiHoSoIds.length > 0
          ? {
              loai_ho_so_links: {
                create: validLoaiHoSoIds.map((loai_ho_so_id, idx) => ({
                  loai_ho_so_id,
                  thu_tu: idx,
                })),
              },
            }
          : {}),
      },
      include: {
        nhom_tai_lieu: {
          select: { id: true, ma_nhom: true, ten_nhom: true, mau_sac: true },
        },
        _count: { select: { tai_lieu_ho_so: true } },
        loai_ho_so_links: {
          include: {
            loai_ho_so: {
              select: { id: true, ma_loai: true, ten_loai: true, mau_sac: true },
            },
          },
          orderBy: [{ thu_tu: 'asc' }, { loai_ho_so_id: 'asc' }],
        },
      },
    });

    return this.formatLoaiTaiLieu(created);
  }

  async updateLoaiTaiLieu(id: number, dto: UpdateLoaiTaiLieuDto) {
    const existing = await this.prisma.dm_loai_tai_lieu.findUnique({
      where: { id },
      include: {
        _count: { select: { tai_lieu_ho_so: true } },
        loai_ho_so_links: true,
      },
    });
    if (!existing) throw new NotFoundException('Không tìm thấy loại tài liệu');

    let nextMaLoai: string | undefined;
    if (dto.ma_loai_tai_lieu !== undefined) {
      const normalized = this.normalizeCode(dto.ma_loai_tai_lieu);
      if (normalized !== existing.ma_loai_tai_lieu) {
        if (SYSTEM_LOAI_TAI_LIEU_CODES.has(existing.ma_loai_tai_lieu)) {
          throw new BadRequestException('Không thể thay đổi mã của loại tài liệu mặc định hệ thống');
        }
        if (existing._count.tai_lieu_ho_so > 0) {
          throw new BadRequestException('Không thể thay đổi mã loại tài liệu khi đã có tài liệu sử dụng');
        }
        const dup = await this.prisma.dm_loai_tai_lieu.findFirst({
          where: { ma_loai_tai_lieu: normalized, id: { not: id } },
        });
        if (dup) throw new ConflictException(`Mã loại tài liệu "${normalized}" đã tồn tại`);
        nextMaLoai = normalized;
      }
    }

    let nextTenLoai: string | undefined;
    if (dto.ten_loai_tai_lieu !== undefined) {
      nextTenLoai = dto.ten_loai_tai_lieu.trim();
      if (!nextTenLoai) {
        throw new BadRequestException('Tên loại tài liệu không được để trống');
      }
    }

    const nextApDungTatCa = dto.ap_dung_tat_ca ?? existing.ap_dung_tat_ca;
    const shouldReplaceLinks = dto.ap_dung_tat_ca !== undefined || dto.loai_ho_so_ids !== undefined;
    let nextLoaiHoSoIds: number[] = [];

    if (!nextApDungTatCa) {
      const rawIds =
        dto.loai_ho_so_ids !== undefined
          ? dto.loai_ho_so_ids
          : existing.loai_ho_so_links.map((l) => l.loai_ho_so_id);
      nextLoaiHoSoIds = await this.validateLoaiHoSoIds(rawIds);
      if (nextLoaiHoSoIds.length === 0) {
        throw new BadRequestException('Vui lòng chọn ít nhất 1 loại hồ sơ áp dụng hoặc bật "Áp dụng tất cả"');
      }
    }

    const validNhomId = await this.validateNhomTaiLieuId(dto.nhom_tai_lieu_id);

    const cau_hinh_truong = dto.cau_hinh_truong !== undefined
      ? (this.normalizeCustomFields(dto.cau_hinh_truong) as unknown as Prisma.InputJsonValue)
      : undefined;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (shouldReplaceLinks) {
        await tx.dm_loai_ho_so_tai_lieu.deleteMany({ where: { loai_tai_lieu_id: id } });
        if (!nextApDungTatCa && nextLoaiHoSoIds.length > 0) {
          await tx.dm_loai_ho_so_tai_lieu.createMany({
            data: nextLoaiHoSoIds.map((loai_ho_so_id, idx) => ({
              loai_ho_so_id,
              loai_tai_lieu_id: id,
              thu_tu: idx,
            })),
          });
        }
      }

      return tx.dm_loai_tai_lieu.update({
        where: { id },
        data: {
          ...(validNhomId !== undefined ? { nhom_tai_lieu_id: validNhomId } : {}),
          ...(nextMaLoai !== undefined ? { ma_loai_tai_lieu: nextMaLoai } : {}),
          ...(nextTenLoai !== undefined ? { ten_loai_tai_lieu: nextTenLoai } : {}),
          ...(dto.mo_ta !== undefined ? { mo_ta: dto.mo_ta?.trim() || null } : {}),
          ...(dto.mau_sac !== undefined ? { mau_sac: dto.mau_sac?.trim() || null } : {}),
          ...(dto.thu_tu !== undefined ? { thu_tu: dto.thu_tu } : {}),
          ...(dto.trang_thai !== undefined ? { trang_thai: dto.trang_thai } : {}),
          ...(dto.ap_dung_tat_ca !== undefined ? { ap_dung_tat_ca: dto.ap_dung_tat_ca } : {}),
          ...(cau_hinh_truong !== undefined ? { cau_hinh_truong } : {}),
        },
        include: {
          nhom_tai_lieu: {
            select: { id: true, ma_nhom: true, ten_nhom: true, mau_sac: true },
          },
          _count: { select: { tai_lieu_ho_so: true } },
          loai_ho_so_links: {
            include: {
              loai_ho_so: {
                select: { id: true, ma_loai: true, ten_loai: true, mau_sac: true },
              },
            },
            orderBy: [{ thu_tu: 'asc' }, { loai_ho_so_id: 'asc' }],
          },
        },
      });
    });

    return this.formatLoaiTaiLieu(updated);
  }

  async deleteLoaiTaiLieu(id: number) {
    const existing = await this.prisma.dm_loai_tai_lieu.findUnique({
      where: { id },
      include: { _count: { select: { tai_lieu_ho_so: true } } },
    });
    if (!existing) throw new NotFoundException('Không tìm thấy loại tài liệu');

    if (SYSTEM_LOAI_TAI_LIEU_CODES.has(existing.ma_loai_tai_lieu)) {
      throw new BadRequestException(
        'Không thể xóa loại tài liệu mặc định hệ thống. Bạn có thể đổi tên hoặc chuyển sang Ngưng hoạt động.',
      );
    }

    if (existing._count.tai_lieu_ho_so > 0) {
      throw new ConflictException(
        `Không thể xóa loại tài liệu đang được sử dụng bởi ${existing._count.tai_lieu_ho_so} tài liệu. Vui lòng chuyển sang Ngưng hoạt động.`,
      );
    }

    await this.prisma.dm_loai_tai_lieu.delete({ where: { id } });
    return { message: 'Xóa loại tài liệu thành công' };
  }

  private async syncTaiLieuGroupPermissionCodes(
    client: any,
    oldCode: string,
    newCode: string | null,
  ) {
    const oldPrefix = `HOSO_TAI_LIEU_GROUP:${oldCode.trim().toUpperCase()}:`;
    const newPrefix = newCode ? `HOSO_TAI_LIEU_GROUP:${newCode.trim().toUpperCase()}:` : null;

    const rewriteJson = (raw: string | null): string | null | undefined => {
      if (!raw) return undefined;
      try {
        const list = JSON.parse(raw);
        if (!Array.isArray(list)) return undefined;
        let changed = false;
        const nextList: string[] = [];
        for (const item of list) {
          if (typeof item === 'string' && item.startsWith(oldPrefix)) {
            changed = true;
            if (newPrefix) {
              nextList.push(newPrefix + item.slice(oldPrefix.length));
            }
          } else {
            nextList.push(item);
          }
        }
        if (!changed) return undefined;
        return nextList.length > 0 ? JSON.stringify(Array.from(new Set(nextList))) : null;
      } catch {
        return undefined;
      }
    };

    if (client?.vai_tro?.findMany) {
      const roles = await client.vai_tro.findMany({ where: { quyen_han: { contains: oldPrefix } } });
      for (const role of roles) {
        const nextJson = rewriteJson(role.quyen_han);
        if (nextJson !== undefined) {
          await client.vai_tro.update({ where: { id: role.id }, data: { quyen_han: nextJson } });
        }
      }
    }

    if (client?.nguoi_dung?.findMany) {
      const users = await client.nguoi_dung.findMany({ where: { quyen_rieng: { contains: oldPrefix } } });
      for (const user of users) {
        const nextJson = rewriteJson(user.quyen_rieng);
        if (nextJson !== undefined) {
          await client.nguoi_dung.update({ where: { id: user.id }, data: { quyen_rieng: nextJson } });
        }
      }
    }
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
