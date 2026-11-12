import { Injectable, NotFoundException, ConflictException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHoSoDto } from './dto/create-ho-so.dto';
import { UpdateHoSoDto } from './dto/update-ho-so.dto';
import { CapSoDto } from './dto/cap-so.dto';
import { GiaHanDto } from './dto/gia-han.dto';
import { ThayTheDto } from './dto/thay-the.dto';
import { ThayDoiDto } from './dto/thay-doi.dto';
import { QuyDinhTamThoiDto } from './dto/quy-dinh-tam-thoi.dto';
import { TaiLieuDto, UpdateTaiLieuDto, ReplaceTaiLieuDto } from './dto/tai-lieu.dto';
import { Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { dossierSnapshot } from './ho-so-audit';
import { dateOnly, expiryStatus, EXPIRY_STATUSES, reminderDate, ExpiryConfig, DEFAULT_EXPIRY_CONFIG, effectiveExpiryDate } from './expiry';

const LEGACY_DETAIL_SPECS: Record<string, {
  tableKey: 'ho_so_thuoc' | 'ho_so_my_pham' | 'ho_so_tbyt' | 'ho_so_tpbvsk_tu_cong_bo' | 'ho_so_tpbvsk_cong_bo' | 'ho_so_cfs_cpp';
  fields: Record<string, string>;
}> = {
  THUOC: { tableKey: 'ho_so_thuoc', fields: Prisma.Ho_so_thuocScalarFieldEnum },
  MY_PHAM: { tableKey: 'ho_so_my_pham', fields: Prisma.Ho_so_my_phamScalarFieldEnum },
  TBYT: { tableKey: 'ho_so_tbyt', fields: Prisma.Ho_so_tbytScalarFieldEnum },
  TPBVSK_TU_CONG_BO: { tableKey: 'ho_so_tpbvsk_tu_cong_bo', fields: Prisma.Ho_so_tpbvsk_tu_cong_boScalarFieldEnum },
  TPBVSK_CONG_BO: { tableKey: 'ho_so_tpbvsk_cong_bo', fields: Prisma.Ho_so_tpbvsk_cong_boScalarFieldEnum },
  CFS_CPP: { tableKey: 'ho_so_cfs_cpp', fields: Prisma.Ho_so_cfs_cppScalarFieldEnum },
};

@Injectable()
export class HoSoService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2
  ) {}

  private splitThongTinRieng(maLoai: string, thongTinRieng?: Record<string, any>) {
    if (!thongTinRieng || typeof thongTinRieng !== 'object') {
      return { legacyData: null as Record<string, any> | null, customData: null as Record<string, any> | null, spec: LEGACY_DETAIL_SPECS[maLoai] };
    }
    const { id: _id, ho_so_chung_id: _cid, ...clean } = thongTinRieng;
    const spec = LEGACY_DETAIL_SPECS[maLoai];
    if (!spec) {
      return {
        legacyData: null,
        customData: Object.keys(clean).length > 0 ? clean : null,
        spec: undefined,
      };
    }

    const legacyAllowed = new Set(Object.values(spec.fields));
    const legacyData: Record<string, any> = {};
    const customData: Record<string, any> = {};

    for (const [k, v] of Object.entries(clean)) {
      if (legacyAllowed.has(k)) {
        legacyData[k] = v;
      } else if (v !== undefined) {
        customData[k] = v;
      }
    }

    return {
      legacyData: Object.keys(legacyData).length > 0 ? legacyData : null,
      customData: Object.keys(customData).length > 0 ? customData : null,
      spec,
    };
  }

  private async getLoaiHoSoExpiryConfig(loaiHoSoId?: number | null): Promise<ExpiryConfig> {
    if (!loaiHoSoId) return DEFAULT_EXPIRY_CONFIG;
    const loai = await this.prisma.dm_loai_ho_so.findUnique({
      where: { id: loaiHoSoId },
      select: { thoi_gian_canh_bao: true, don_vi_canh_bao: true },
    });
    if (!loai) return DEFAULT_EXPIRY_CONFIG;
    return {
      value: loai.thoi_gian_canh_bao ?? 6,
      unit: loai.don_vi_canh_bao ?? 'THANG',
    };
  }

  private async expiryStatusId(expiry: Date | null, config?: ExpiryConfig): Promise<number> {
    const code = expiryStatus(expiry, config);
    const status = await this.prisma.dm_tinh_trang.findUnique({ where: { ma_tinh_trang: code } });
    if (!status) throw new InternalServerErrorException(`Thiếu trạng thái hồ sơ ${code}`);
    return status.id;
  }

  private async getLoaiThayDoi(ma: string, ten: string) {
    let loaiThayDoi = await this.prisma.dm_loai_thay_doi.findFirst({ where: { ma_loai_thay_doi: ma } });
    if (!loaiThayDoi) {
      loaiThayDoi = await this.prisma.dm_loai_thay_doi.create({ data: { ma_loai_thay_doi: ma, ten_loai_thay_doi: ten } });
    }
    return loaiThayDoi;
  }

  private emitHoSoEvent(hoSo: any, action: string, eventName: string, extraData: any = {}) {
    const ownerId = hoSo.nhat_ky?.find((n: any) => n.hanh_dong === 'CREATE')?.nguoi_thuc_hien_id || null;
    this.eventEmitter.emit('hoSo.updated', {
      ownerId,
      id: hoSo.id,
      ma_ho_so: hoSo.ma_ho_so,
      ten_san_pham: hoSo.ten_san_pham,
      so_chinh: hoSo.so_chinh,
      action,
      eventName,
      time: new Date(),
      ...extraData
    });
  }

  async findAll(query: any) {
    const {
      search,
      loai_ho_so,
      tinh_trang,
      cong_ty_id,
      ngay_het_han_from,
      ngay_het_han_to,
      page = 1,
      limit = 10
    } = query;

    const andConditions: Prisma.ho_so_chungWhereInput[] = [];

    if (search) {
      const searchPattern = `%${String(search).toLowerCase()}%`;
      const rawMatches = await this.prisma.$queryRaw<Array<{ id: number }>>`
        SELECT id FROM ho_so_chung
        WHERE du_lieu_dac_thu IS NOT NULL
          AND LOWER(CAST(du_lieu_dac_thu AS CHAR)) LIKE ${searchPattern}
      `;
      const dynamicMatchedIds = rawMatches.map((r) => Number(r.id)).filter((n) => !Number.isNaN(n));

      const searchOrConditions: Prisma.ho_so_chungWhereInput[] = [
        // Bảng chung
        { ma_ho_so: { contains: search } },
        { so_chinh: { contains: search } },
        { ten_san_pham: { contains: search } },
        { ten_san_pham_khong_dau: { contains: search } },
        { ma_san_pham_noi_bo: { contains: search } },

        // Chi tiết Thuốc
        { ho_so_thuoc: { is: { OR: [
          { hoat_chat_ham_luong: { contains: search } },
          { bao_che: { contains: search } },
          { quy_cach_dong_goi: { contains: search } }
        ]}}},

        // Chi tiết Mỹ Phẩm
        { ho_so_my_pham: { is: { OR: [
          { nhan_hang: { contains: search } },
          { dang_my_pham: { contains: search } }
        ]}}},

        // Chi tiết TBYT
        { ho_so_tbyt: { is: { OR: [
          { ten_thuong_mai: { contains: search } },
          { ten_tbyt_chung_loai: { contains: search } },
          { chu_so_huu: { contains: search } }
        ]}}},

        // Chi tiết TPBVSK Tự Công Bố
        { ho_so_tpbvsk_tu_cong_bo: { is: { OR: [
          { co_so_dung_ten: { contains: search } },
          { dang_san_pham: { contains: search } }
        ]}}},

        // Chi tiết TPBVSK Công Bố
        { ho_so_tpbvsk_cong_bo: { is: { OR: [
          { thanh_phan: { contains: search } },
          { chu_so_huu: { contains: search } }
        ]}}},

        // Chi tiết CFS/CPP
        { ho_so_cfs_cpp: { is: { OR: [
          { nuoc_xuat_khau: { contains: search } }
        ]}}},
      ];

      if (dynamicMatchedIds.length > 0) {
        searchOrConditions.push({ id: { in: dynamicMatchedIds } });
      }

      andConditions.push({ OR: searchOrConditions });
    }

    if (loai_ho_so) andConditions.push({ loai_ho_so_id: Number(loai_ho_so) });
    if (tinh_trang) andConditions.push({ tinh_trang_id: Number(tinh_trang) });
    
    if (cong_ty_id) {
      const cid = Number(cong_ty_id);
      andConditions.push({
        OR: [
          { cong_ty_so_huu_id: cid },
          { cong_ty_dung_ten_id: cid },
          { cong_ty_phan_phoi_id: cid }
        ]
      });
    }

    if (ngay_het_han_from || ngay_het_han_to) {
      const dateFilter: any = {};
      if (ngay_het_han_from) dateFilter.gte = new Date(ngay_het_han_from);
      if (ngay_het_han_to) dateFilter.lte = new Date(ngay_het_han_to);
      andConditions.push({ ngay_het_han: dateFilter });
    }

    const where: Prisma.ho_so_chungWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

    const skip = (Number(page) - 1) * Number(limit);

    const [total, data] = await Promise.all([
      this.prisma.ho_so_chung.count({ where }),
      this.prisma.ho_so_chung.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          loai_ho_so: true,
          tinh_trang: true,
          cong_ty_so_huu: true
        },
        orderBy: { created_at: 'desc' }
      })
    ]);

    return { total, page: Number(page), limit: Number(limit), data };
  }

  async dashboard(query: { category?: string; page?: string; limit?: string }) {
    const category = query.category || 'SAP_HET_HAN';
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const [statuses, counts] = await Promise.all([
      this.prisma.dm_tinh_trang.findMany({ select: { id: true, ma_tinh_trang: true } }),
      this.prisma.ho_so_chung.groupBy({ by: ['tinh_trang_id'], _count: { _all: true } }),
    ]);
    const idByCode = new Map(statuses.map((item) => [item.ma_tinh_trang, item.id]));
    const countById = new Map(counts.map((item) => [item.tinh_trang_id, item._count._all]));
    const count = (code: string) => countById.get(idByCode.get(code) ?? -1) ?? 0;
    const stats = {
      tongSo: counts.reduce((sum, item) => sum + item._count._all, 0),
      dangXuLy: count('DANG_XU_LY'),
      conHieuLuc: count('CON_HIEU_LUC'),
      sapHetHan: count('SAP_HET_HAN'),
      daHetHan: count('DA_HET_HAN'),
      thayThe: count('DA_THAY_THE') + count('DA_BI_THAY_THE'),
      thuHoi: count('BI_THU_HOI'),
    };
    const statusId = idByCode.get(category);
    const replacedIds = [idByCode.get('DA_THAY_THE'), idByCode.get('DA_BI_THAY_THE')]
      .filter((id): id is number => id !== undefined);
    const where: Prisma.ho_so_chungWhereInput = category === 'TOTAL'
      ? {} : category === 'DA_THAY_THE'
        ? { tinh_trang_id: { in: replacedIds } }
        : { tinh_trang_id: statusId ?? -1 };
    const total = category === 'TOTAL' ? stats.tongSo
      : category === 'DA_THAY_THE' ? stats.thayThe : count(category);
    const data = await this.prisma.ho_so_chung.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: { loai_ho_so: true, tinh_trang: true },
      orderBy: category === 'SAP_HET_HAN' || category === 'DA_HET_HAN'
        ? [{ ngay_het_han: 'asc' }, { id: 'asc' }] : [{ created_at: 'desc' }, { id: 'desc' }],
    });
    return { stats, total, page, limit, data };
  }

  async findOne(id: number) {
    const hoSo = await this.prisma.ho_so_chung.findUnique({
      where: { id },
      include: {
        loai_ho_so: true,
        tinh_trang: true,
        cong_ty_so_huu: true,
        cong_ty_dung_ten: true,
        cong_ty_phan_phoi: true,
        ho_so_thuoc: true,
        ho_so_my_pham: true,
        ho_so_tbyt: true,
        ho_so_tpbvsk_tu_cong_bo: true,
        ho_so_tpbvsk_cong_bo: true,
        ho_so_cfs_cpp: true,
        tai_lieu: {
          include: {
            loai_tai_lieu: true,
            nguoi_tai_len: { select: { id: true, ho_ten: true } },
          },
          orderBy: [
            { tai_lieu_hien_hanh: 'desc' },
            { so_phien_ban: 'desc' },
            { ngay_tai_len: 'desc' },
          ],
        },
        lich_su_thay_doi: true,
        nhat_ky: { 
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            hanh_dong: true,
            nguoi_thuc_hien_id: true,
            noi_dung: true,
            created_at: true,
            nguoi_thuc_hien: { select: { ho_ten: true } }
          }
        }
      }
    });

    if (!hoSo) throw new NotFoundException('Không tìm thấy hồ sơ');
    return hoSo;
  }

  async create(data: CreateHoSoDto, userId?: number) {
    const { thong_tin_rieng, nguoi_thuc_hien_id, ...chungData } = data;
    const expiry = dateOnly(chungData.ngay_het_han);
    const expiryQuyDinh = dateOnly(chungData.ngay_het_han_quy_dinh);
    const effectiveExpiry = effectiveExpiryDate(expiry, chungData.ap_dung_quy_dinh_tam_thoi, expiryQuyDinh);
    const expiryConfig = await this.getLoaiHoSoExpiryConfig(data.loai_ho_so_id);
    const requestedStatus = chungData.tinh_trang_id
      ? await this.prisma.dm_tinh_trang.findUnique({ where: { id: chungData.tinh_trang_id } }) : null;
    const statusId = requestedStatus && EXPIRY_STATUSES.includes(requestedStatus.ma_tinh_trang as any)
      ? await this.expiryStatusId(effectiveExpiry, expiryConfig)
      : (chungData.tinh_trang_id ?? (effectiveExpiry ? await this.expiryStatusId(effectiveExpiry, expiryConfig) : undefined));

    const exists = await this.prisma.ho_so_chung.findUnique({ where: { ma_ho_so: data.ma_ho_so } });
    if (exists) throw new ConflictException('Mã hồ sơ đã tồn tại');

    const loaiHoSo = await this.prisma.dm_loai_ho_so.findUnique({ where: { id: data.loai_ho_so_id } });
    if (!loaiHoSo) throw new NotFoundException('Không tìm thấy loại hồ sơ');
    if (!loaiHoSo.trang_thai) throw new BadRequestException('Loại hồ sơ này đã ngưng hoạt động');

    const { legacyData, customData, spec } = this.splitThongTinRieng(loaiHoSo.ma_loai, thong_tin_rieng);

    const result = await this.prisma.$transaction(async (tx) => {
      const hoSoChung = await tx.ho_so_chung.create({
        data: {
          ...chungData,
          ngay_cong_bo: chungData.ngay_cong_bo ? new Date(chungData.ngay_cong_bo) : null,
          ngay_het_han: expiry,
          ap_dung_quy_dinh_tam_thoi: chungData.ap_dung_quy_dinh_tam_thoi ?? false,
          ngay_het_han_quy_dinh: expiryQuyDinh,
          can_cu_quy_dinh: chungData.can_cu_quy_dinh,
          tai_lieu_quy_dinh_url: chungData.tai_lieu_quy_dinh_url,
          ngay_nhac_han: reminderDate(effectiveExpiry, expiryConfig),
          tinh_trang_id: statusId,
          du_lieu_dac_thu: customData ? (customData as Prisma.InputJsonValue) : Prisma.JsonNull,
        }
      });

      if (spec && legacyData) {
        const delegate = tx[spec.tableKey] as any;
        await delegate.create({ data: { ho_so_chung_id: hoSoChung.id, ...legacyData } });
      }

      await tx.nhat_ky_ho_so.create({
        data: {
          ho_so_chung_id: hoSoChung.id,
          hanh_dong: 'CREATE',
          nguoi_thuc_hien_id: userId || nguoi_thuc_hien_id || null,
          noi_dung: `Tạo mới hồ sơ ${chungData.ma_ho_so}`,
          du_lieu_cu: null,
          du_lieu_moi: JSON.stringify({ chung: chungData, rieng: thong_tin_rieng })
        }
      });

      return hoSoChung;
    });

    this.eventEmitter.emit('hoSo.created', {
      ownerId: userId || nguoi_thuc_hien_id || null,
      id: result.id,
      ma_ho_so: result.ma_ho_so,
      ten_san_pham: result.ten_san_pham,
      action: 'CREATE',
      eventName: 'HO_SO_CREATED',
      time: new Date(),
    });

    return result;
  }

  private async findForUpdate(id: number) {
    const dossier = await this.prisma.ho_so_chung.findUnique({
      where: { id },
      include: {
        loai_ho_so: true,
        tinh_trang: true,
        ho_so_thuoc: true,
        ho_so_my_pham: true,
        ho_so_tbyt: true,
        ho_so_tpbvsk_tu_cong_bo: true,
        ho_so_tpbvsk_cong_bo: true,
        ho_so_cfs_cpp: true,
        nhat_ky: {
          where: { hanh_dong: 'CREATE' },
          select: { hanh_dong: true, nguoi_thuc_hien_id: true },
          take: 1,
        },
      },
    });
    if (!dossier) throw new NotFoundException('Không tìm thấy hồ sơ');
    return dossier;
  }

  async update(id: number, data: UpdateHoSoDto, userId?: number) {
    const hoSo = await this.findForUpdate(id);
    const { thong_tin_rieng, nguoi_thuc_hien_id, ...chungData } = data;
    const expiry = Object.hasOwn(chungData, 'ngay_het_han')
      ? dateOnly(chungData.ngay_het_han) : dateOnly(hoSo.ngay_het_han);
    const apDung = Object.hasOwn(chungData, 'ap_dung_quy_dinh_tam_thoi')
      ? Boolean(chungData.ap_dung_quy_dinh_tam_thoi) : Boolean(hoSo.ap_dung_quy_dinh_tam_thoi);
    const expiryQuyDinh = Object.hasOwn(chungData, 'ngay_het_han_quy_dinh')
      ? dateOnly(chungData.ngay_het_han_quy_dinh) : dateOnly(hoSo.ngay_het_han_quy_dinh);
    const effectiveExpiry = effectiveExpiryDate(expiry, apDung, expiryQuyDinh);

    const loaiHoSoId = chungData.loai_ho_so_id || hoSo.loai_ho_so_id;
    const isChangingLoai = Boolean(chungData.loai_ho_so_id && chungData.loai_ho_so_id !== hoSo.loai_ho_so_id);
    const targetLoaiHoSo = isChangingLoai
      ? await this.prisma.dm_loai_ho_so.findUnique({ where: { id: loaiHoSoId } })
      : hoSo.loai_ho_so;
    if (!targetLoaiHoSo) throw new NotFoundException('Không tìm thấy loại hồ sơ');
    if (isChangingLoai && !targetLoaiHoSo.trang_thai) {
      throw new BadRequestException('Loại hồ sơ mới đã ngưng hoạt động');
    }

    const expiryConfig = await this.getLoaiHoSoExpiryConfig(loaiHoSoId);
    const requestedStatus = chungData.tinh_trang_id !== undefined
      ? await this.prisma.dm_tinh_trang.findUnique({ where: { id: chungData.tinh_trang_id } }) : hoSo.tinh_trang;
    const statusId = requestedStatus && EXPIRY_STATUSES.includes(requestedStatus.ma_tinh_trang as any)
      ? await this.expiryStatusId(effectiveExpiry, expiryConfig)
      : (chungData.tinh_trang_id ?? (hoSo.tinh_trang_id == null && effectiveExpiry ? await this.expiryStatusId(effectiveExpiry, expiryConfig) : undefined));

    if (data.ma_ho_so) {
      const exists = await this.prisma.ho_so_chung.findFirst({
        where: { ma_ho_so: data.ma_ho_so, id: { not: id } }
      });
      if (exists) throw new ConflictException('Mã hồ sơ đã tồn tại');
    }

    const hasThongTinRieng = thong_tin_rieng !== undefined;
    const { legacyData, customData, spec } = hasThongTinRieng
      ? this.splitThongTinRieng(targetLoaiHoSo.ma_loai, thong_tin_rieng)
      : { legacyData: null, customData: null, spec: LEGACY_DETAIL_SPECS[targetLoaiHoSo.ma_loai] };

    const nextDuLieuDacThu = hasThongTinRieng
      ? (customData ? (customData as Prisma.InputJsonValue) : Prisma.JsonNull)
      : (isChangingLoai ? Prisma.JsonNull : undefined);

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedChung = await tx.ho_so_chung.update({
        where: { id },
        data: {
          ...chungData,
          ngay_cong_bo: chungData.ngay_cong_bo ? new Date(chungData.ngay_cong_bo) : undefined,
          ngay_het_han: Object.hasOwn(chungData, 'ngay_het_han') ? expiry : undefined,
          ap_dung_quy_dinh_tam_thoi: chungData.ap_dung_quy_dinh_tam_thoi,
          ngay_het_han_quy_dinh: Object.hasOwn(chungData, 'ngay_het_han_quy_dinh') ? expiryQuyDinh : undefined,
          can_cu_quy_dinh: chungData.can_cu_quy_dinh,
          tai_lieu_quy_dinh_url: chungData.tai_lieu_quy_dinh_url,
          ngay_nhac_han: reminderDate(effectiveExpiry, expiryConfig),
          tinh_trang_id: statusId,
          ...(nextDuLieuDacThu !== undefined ? { du_lieu_dac_thu: nextDuLieuDacThu } : {}),
        }
      });

      if (isChangingLoai) {
        const oldSpec = LEGACY_DETAIL_SPECS[hoSo.loai_ho_so.ma_loai];
        if (oldSpec) {
          await (tx[oldSpec.tableKey] as any).deleteMany({ where: { ho_so_chung_id: id } });
        }
      }

      if (hasThongTinRieng && spec && legacyData) {
        const delegate = tx[spec.tableKey] as any;
        await delegate.upsert({
          where: { ho_so_chung_id: id },
          update: legacyData,
          create: { ho_so_chung_id: id, ...legacyData }
        });
      }

      await tx.nhat_ky_ho_so.create({
        data: {
          ho_so_chung_id: id,
          hanh_dong: 'UPDATE',
          nguoi_thuc_hien_id: userId || nguoi_thuc_hien_id || null,
          noi_dung: `Cập nhật hồ sơ ${updatedChung.ma_ho_so}`,
          du_lieu_cu: JSON.stringify(dossierSnapshot(hoSo)),
          du_lieu_moi: JSON.stringify({ chung: chungData, rieng: thong_tin_rieng })
        }
      });

      return updatedChung;
    });
    
    // Phát sự kiện thông báo qua Event Emitter
    this.emitHoSoEvent(hoSo, 'UPDATE', 'HO_SO_UPDATED');

    return result;
  }

  async capSo(id: number, data: CapSoDto, userId?: number) {
    const hoSo = await this.findOne(id);
    const expiry = dateOnly(data.ngay_het_han);
    const expiryConfig = await this.getLoaiHoSoExpiryConfig(hoSo.loai_ho_so_id);
    const statusId = await this.expiryStatusId(expiry, expiryConfig);
    
    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.ho_so_chung.update({
        where: { id },
        data: {
          so_chinh: data.so_chinh,
          ngay_cong_bo: new Date(data.ngay_cong_bo),
          ngay_het_han: expiry,
          ngay_nhac_han: reminderDate(expiry, expiryConfig),
          tinh_trang_id: statusId
        }
      });

      await tx.lich_su_thay_doi_ho_so.create({
        data: {
          ho_so_chung_id: id,
          lan_thu: data.lan_thu || hoSo.lich_su_thay_doi.length + 1,
          loai_thay_doi_id: data.loai_thay_doi_id || (await this.getLoaiThayDoi('CAP_SO', 'Cấp số')).id,
          noi_dung_thay_doi: data.noi_dung_thay_doi || `Cấp số: ${data.so_chinh}`,
          ma_so_tham_chieu: data.ma_so_tham_chieu,
          ngay_thay_doi: data.ngay_thay_doi ? new Date(data.ngay_thay_doi) : new Date(),
          ngay_phe_duyet: data.ngay_phe_duyet ? new Date(data.ngay_phe_duyet) : undefined,
          tinh_trang: data.tinh_trang || 'DA_PHE_DUYET',
          cong_van_url: data.cong_van_url,
          ghi_chu: data.ghi_chu
        }
      });
      
      await tx.nhat_ky_ho_so.create({
        data: {
          ho_so_chung_id: id,
          hanh_dong: 'CAP_SO',
          nguoi_thuc_hien_id: userId || null,
          noi_dung: `Cấp số công bố ${data.so_chinh} cho hồ sơ`,
          du_lieu_cu: JSON.stringify({ so_chinh: hoSo.so_chinh, tinh_trang_id: hoSo.tinh_trang_id }),
          du_lieu_moi: JSON.stringify({ so_chinh: data.so_chinh, tinh_trang_id: statusId })
        }
      });
      return updated;
    });

    this.emitHoSoEvent(result, 'CAP_SO', 'HO_SO_CAP_SO', {
      so_chinh: data.so_chinh,
      noi_dung: `Cấp số công bố/đăng ký: ${data.so_chinh}`
    });

    return result;
  }

  async giaHan(id: number, data: GiaHanDto, userId?: number) {
    const hoSo = await this.findOne(id);
    const expiry = dateOnly(data.ngay_het_han);
    const expiryConfig = await this.getLoaiHoSoExpiryConfig(hoSo.loai_ho_so_id);
    const statusId = await this.expiryStatusId(expiry, expiryConfig);

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.ho_so_chung.update({
        where: { id },
        data: {
          ngay_het_han: expiry!,
          ngay_nhac_han: reminderDate(expiry, expiryConfig),
          tinh_trang_id: statusId
        }
      });

      await tx.lich_su_thay_doi_ho_so.create({
        data: {
          ho_so_chung_id: id,
          lan_thu: data.lan_thu || hoSo.lich_su_thay_doi.length + 1,
          loai_thay_doi_id: data.loai_thay_doi_id || (await this.getLoaiThayDoi('GIA_HAN', 'Gia hạn')).id,
          noi_dung_thay_doi: data.noi_dung_thay_doi || `Gia hạn đến ngày: ${data.ngay_het_han}`,
          ma_so_tham_chieu: data.ma_so_tham_chieu,
          ngay_thay_doi: data.ngay_thay_doi ? new Date(data.ngay_thay_doi) : new Date(),
          ngay_phe_duyet: data.ngay_phe_duyet ? new Date(data.ngay_phe_duyet) : undefined,
          tinh_trang: data.tinh_trang || 'DA_PHE_DUYET',
          cong_van_url: data.cong_van_url,
          ghi_chu: data.ghi_chu || `Ngày hết hạn cũ: ${hoSo.ngay_het_han}`
        }
      });

      await tx.nhat_ky_ho_so.create({
        data: {
          ho_so_chung_id: id,
          hanh_dong: 'GIA_HAN',
          nguoi_thuc_hien_id: userId || null,
          noi_dung: `Gia hạn số công bố ${hoSo.so_chinh}`,
          du_lieu_cu: JSON.stringify({ ngay_het_han: hoSo.ngay_het_han }),
          du_lieu_moi: JSON.stringify({ ngay_het_han: data.ngay_het_han })
        }
      });
      return updated;
    });

    this.emitHoSoEvent(result, 'GIA_HAN', 'HO_SO_GIA_HAN', {
      noi_dung: data.noi_dung_thay_doi || `Gia hạn đến ngày: ${new Date(data.ngay_het_han).toLocaleDateString('vi-VN')}`
    });

    return result;
  }

  async apDungQuyDinh(id: number, data: QuyDinhTamThoiDto, userId?: number) {
    const hoSo = await this.findOne(id);
    const expiry = dateOnly(hoSo.ngay_het_han);
    const expiryQuyDinh = dateOnly(data.ngay_het_han_quy_dinh);
    const effectiveExpiry = effectiveExpiryDate(expiry, data.ap_dung_quy_dinh_tam_thoi, expiryQuyDinh);
    const expiryConfig = await this.getLoaiHoSoExpiryConfig(hoSo.loai_ho_so_id);
    const statusId = await this.expiryStatusId(effectiveExpiry, expiryConfig);

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.ho_so_chung.update({
        where: { id },
        data: {
          ap_dung_quy_dinh_tam_thoi: data.ap_dung_quy_dinh_tam_thoi,
          ngay_het_han_quy_dinh: expiryQuyDinh,
          can_cu_quy_dinh: data.can_cu_quy_dinh,
          tai_lieu_quy_dinh_url: data.tai_lieu_quy_dinh_url,
          ngay_nhac_han: reminderDate(effectiveExpiry, expiryConfig),
          tinh_trang_id: statusId,
        }
      });

      const loaiThayDoi = await this.getLoaiThayDoi(
        'QUY_DINH_TAM_THOI',
        'Áp dụng quy định tạm thời'
      );

      const noiDung = data.ap_dung_quy_dinh_tam_thoi
        ? `Áp dụng quy định tạm thời (${data.can_cu_quy_dinh || 'Theo quy định'}): ${data.ngay_het_han_quy_dinh ? `Duy trì hiệu lực đến ${new Date(data.ngay_het_han_quy_dinh).toLocaleDateString('vi-VN')}` : 'Duy trì hiệu lực'}`
        : 'Hủy áp dụng quy định tạm thời, áp dụng hạn sử dụng gốc';

      await tx.lich_su_thay_doi_ho_so.create({
        data: {
          ho_so_chung_id: id,
          lan_thu: (hoSo.lich_su_thay_doi?.length || 0) + 1,
          loai_thay_doi_id: loaiThayDoi.id,
          noi_dung_thay_doi: noiDung,
          ma_so_tham_chieu: data.can_cu_quy_dinh,
          ngay_thay_doi: new Date(),
          tinh_trang: 'DA_PHE_DUYET',
          cong_van_url: data.tai_lieu_quy_dinh_url,
          ghi_chu: data.ghi_chu || `Hạn gốc: ${hoSo.ngay_het_han ? new Date(hoSo.ngay_het_han).toLocaleDateString('vi-VN') : 'Không có'}`
        }
      });

      await tx.nhat_ky_ho_so.create({
        data: {
          ho_so_chung_id: id,
          hanh_dong: 'QUY_DINH_TAM_THOI',
          nguoi_thuc_hien_id: userId || null,
          noi_dung: noiDung,
          du_lieu_cu: JSON.stringify({
            ap_dung_quy_dinh_tam_thoi: hoSo.ap_dung_quy_dinh_tam_thoi,
            ngay_het_han_quy_dinh: hoSo.ngay_het_han_quy_dinh,
            can_cu_quy_dinh: hoSo.can_cu_quy_dinh,
            tinh_trang_id: hoSo.tinh_trang_id,
          }),
          du_lieu_moi: JSON.stringify({
            ap_dung_quy_dinh_tam_thoi: data.ap_dung_quy_dinh_tam_thoi,
            ngay_het_han_quy_dinh: data.ngay_het_han_quy_dinh,
            can_cu_quy_dinh: data.can_cu_quy_dinh,
            tinh_trang_id: statusId,
          })
        }
      });

      return updated;
    });

    this.emitHoSoEvent(result, 'QUY_DINH_TAM_THOI', 'HO_SO_QUY_DINH_TAM_THOI', {
      noi_dung: data.ap_dung_quy_dinh_tam_thoi
        ? `Áp dụng quy định tạm thời (${data.can_cu_quy_dinh}) đến ${data.ngay_het_han_quy_dinh}`
        : 'Hủy áp dụng quy định tạm thời'
    });

    return result;
  }

  async thayThe(id: number, data: ThayTheDto, userId?: number) {
    const hoSoCu = await this.findOne(id);
    let ttDaThayTheMoi = await this.prisma.dm_tinh_trang.findFirst({ where: { ma_tinh_trang: 'DA_THAY_THE' } });
    if (!ttDaThayTheMoi) {
      ttDaThayTheMoi = await this.prisma.dm_tinh_trang.create({ data: { ma_tinh_trang: 'DA_THAY_THE', ten_tinh_trang: 'Đã thay thế' } });
    }
    const expiry = dateOnly(data.ngay_het_han);
    const expiryConfig = await this.getLoaiHoSoExpiryConfig(hoSoCu.loai_ho_so_id);
    const statusId = await this.expiryStatusId(expiry, expiryConfig);

    const result = await this.prisma.$transaction(async (tx) => {
      // Create new
      const hoSoMoi = await tx.ho_so_chung.create({
        data: {
          ma_ho_so: data.ma_ho_so_moi,
          so_chinh: data.so_chinh_moi,
          loai_ho_so_id: hoSoCu.loai_ho_so_id,
          ten_san_pham: hoSoCu.ten_san_pham,
          ten_san_pham_khong_dau: hoSoCu.ten_san_pham_khong_dau,
          ma_san_pham_noi_bo: hoSoCu.ma_san_pham_noi_bo,
          cong_ty_so_huu_id: hoSoCu.cong_ty_so_huu_id,
          cong_ty_dung_ten_id: hoSoCu.cong_ty_dung_ten_id,
          cong_ty_phan_phoi_id: hoSoCu.cong_ty_phan_phoi_id,
          ngay_cong_bo: new Date(data.ngay_cong_bo),
          ngay_het_han: expiry,
          ngay_nhac_han: reminderDate(expiry, expiryConfig),
          tinh_trang_id: statusId,
          ho_so_cu_id: hoSoCu.id
        }
      });

      // Update old status
      await tx.ho_so_chung.update({
        where: { id: hoSoCu.id },
        data: { tinh_trang_id: ttDaThayTheMoi?.id }
      });

      await tx.lich_su_thay_doi_ho_so.create({
        data: {
          ho_so_chung_id: hoSoCu.id,
          lan_thu: data.lan_thu || hoSoCu.lich_su_thay_doi.length + 1,
          loai_thay_doi_id: data.loai_thay_doi_id || (await this.getLoaiThayDoi('THAY_THE', 'Thay thế hồ sơ')).id,
          noi_dung_thay_doi: data.noi_dung_thay_doi || `Bị thay thế bởi hồ sơ: ${data.ma_ho_so_moi}`,
          ma_so_tham_chieu: data.ma_so_tham_chieu,
          ngay_thay_doi: data.ngay_thay_doi ? new Date(data.ngay_thay_doi) : new Date(),
          ngay_phe_duyet: data.ngay_phe_duyet ? new Date(data.ngay_phe_duyet) : undefined,
          tinh_trang: data.tinh_trang || 'DA_PHE_DUYET',
          cong_van_url: data.cong_van_url,
          ghi_chu: data.ghi_chu
        }
      });

      await tx.nhat_ky_ho_so.create({
        data: {
          ho_so_chung_id: hoSoCu.id,
          hanh_dong: 'THAY_THE',
          nguoi_thuc_hien_id: userId || null,
          noi_dung: `Đã thay thế bằng hồ sơ mới ${hoSoMoi.ma_ho_so}`,
        }
      });

      return hoSoMoi;
    });

    this.emitHoSoEvent(hoSoCu, 'THAY_THE', 'HO_SO_THAY_THE');

    return result;
  }

  async thayDoi(id: number, data: ThayDoiDto, userId?: number) {
    const hoSo = await this.findOne(id);
    const result = await this.prisma.$transaction(async (tx) => {
      const thayDoi = await tx.lich_su_thay_doi_ho_so.create({
        data: {
          ho_so_chung_id: id,
          lan_thu: data.lan_thu || hoSo.lich_su_thay_doi.length + 1,
          loai_thay_doi_id: data.loai_thay_doi_id || (await this.getLoaiThayDoi('KHAC', 'Khác')).id,
          noi_dung_thay_doi: data.noi_dung_thay_doi,
          ma_so_tham_chieu: data.ma_so_tham_chieu,
          ngay_thay_doi: data.ngay_thay_doi ? new Date(data.ngay_thay_doi) : new Date(),
          ngay_phe_duyet: data.ngay_phe_duyet ? new Date(data.ngay_phe_duyet) : undefined,
          tinh_trang: data.tinh_trang,
          cong_van_url: data.cong_van_url,
          ghi_chu: data.ghi_chu
        }
      });

      await tx.nhat_ky_ho_so.create({
        data: {
          ho_so_chung_id: id,
          hanh_dong: 'THAY_DOI',
          nguoi_thuc_hien_id: userId || null,
          noi_dung: `Thêm thay đổi: ${data.noi_dung_thay_doi || 'Bổ sung thông tin'}`,
        }
      });
      return thayDoi;
    });

    // Phát sự kiện
    this.emitHoSoEvent(hoSo, 'THAY_DOI', 'HO_SO_THAY_DOI', {
      noi_dung: data.noi_dung_thay_doi,
      tinh_trang: data.tinh_trang
    });

    return result;
  }

  async updateLichSuThayDoi(hoSoId: number, lichSuId: number, data: ThayDoiDto, userId?: number) {
    const lichSu = await this.prisma.lich_su_thay_doi_ho_so.findUnique({ where: { id: lichSuId } });
    if (!lichSu || lichSu.ho_so_chung_id !== hoSoId) {
      throw new NotFoundException('Không tìm thấy lịch sử thay đổi');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.lich_su_thay_doi_ho_so.update({
        where: { id: lichSuId },
        data: {
          tinh_trang: data.tinh_trang ?? lichSu.tinh_trang,
          ngay_phe_duyet: data.ngay_phe_duyet !== undefined ? (data.ngay_phe_duyet ? new Date(data.ngay_phe_duyet) : null) : lichSu.ngay_phe_duyet,
          ma_so_tham_chieu: data.ma_so_tham_chieu ?? lichSu.ma_so_tham_chieu,
          cong_van_url: data.cong_van_url ?? lichSu.cong_van_url,
          ghi_chu: data.ghi_chu ?? lichSu.ghi_chu,
          noi_dung_thay_doi: data.noi_dung_thay_doi ?? lichSu.noi_dung_thay_doi,
          loai_thay_doi_id: data.loai_thay_doi_id ?? lichSu.loai_thay_doi_id,
        }
      });

      await tx.nhat_ky_ho_so.create({
        data: {
          ho_so_chung_id: hoSoId,
          hanh_dong: 'UPDATE',
          nguoi_thuc_hien_id: userId || null,
          noi_dung: `Cập nhật thông tin lịch sử thay đổi (Lần ${lichSu.lan_thu})`,
          du_lieu_cu: JSON.stringify(lichSu),
          du_lieu_moi: JSON.stringify(updated)
        }
      });

      return updated;
    });

    const hoSo = await this.findOne(hoSoId);
    this.emitHoSoEvent(hoSo, 'UPDATE_LICH_SU', 'HO_SO_THAY_DOI', {
      tinh_trang: data.tinh_trang
    });

    return result;
  }

  async deleteLichSuThayDoi(hoSoId: number, lichSuId: number, userId?: number) {
    const lichSu = await this.prisma.lich_su_thay_doi_ho_so.findUnique({ where: { id: lichSuId } });
    if (!lichSu || lichSu.ho_so_chung_id !== hoSoId) {
      throw new NotFoundException('Không tìm thấy lịch sử thay đổi');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.lich_su_thay_doi_ho_so.delete({ where: { id: lichSuId } });

      await tx.nhat_ky_ho_so.create({
        data: {
          ho_so_chung_id: hoSoId,
          hanh_dong: 'UPDATE',
          nguoi_thuc_hien_id: userId || null,
          noi_dung: `Đã xóa lịch sử thay đổi (Lần ${lichSu.lan_thu}: ${lichSu.noi_dung_thay_doi})`,
          du_lieu_cu: JSON.stringify(lichSu)
        }
      });

      return { message: 'Xóa lịch sử thay đổi thành công' };
    });
  }

  async remove(id: number) {
    const hoSo = await this.findOne(id);
    await this.prisma.ho_so_chung.delete({ where: { id } });
    return { message: 'Xóa thành công' };
  }

  // --- QUẢN LÝ TÀI LIỆU ĐÍNH KÈM ---

  private cleanDynamicDocData(raw?: Record<string, any> | null) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (v !== undefined) cleaned[k] = v;
    }
    return Object.keys(cleaned).length > 0 ? cleaned : null;
  }

  private async resolveLoaiTaiLieuForHoSo(hoSoLoaiId: number, loaiTaiLieuId?: number) {
    if (loaiTaiLieuId) {
      const loai = await this.prisma.dm_loai_tai_lieu.findUnique({
        where: { id: loaiTaiLieuId },
        include: { loai_ho_so_links: { select: { loai_ho_so_id: true } } },
      });
      if (!loai) throw new NotFoundException('Không tìm thấy loại tài liệu');
      if (!loai.trang_thai) {
        throw new BadRequestException('Loại tài liệu này đã ngưng hoạt động');
      }
      const applies =
        loai.ap_dung_tat_ca ||
        loai.loai_ho_so_links.some((link) => link.loai_ho_so_id === hoSoLoaiId);
      if (!applies) {
        throw new BadRequestException('Loại tài liệu này không áp dụng cho loại hồ sơ hiện tại');
      }
      return loai;
    }

    let loaiKhac = await this.prisma.dm_loai_tai_lieu.findFirst({
      where: { ma_loai_tai_lieu: 'KHAC' },
    });
    if (!loaiKhac) {
      loaiKhac = await this.prisma.dm_loai_tai_lieu.create({
        data: {
          ma_loai_tai_lieu: 'KHAC',
          ten_loai_tai_lieu: 'Tài liệu khác',
          ap_dung_tat_ca: true,
        },
      });
    }
    return loaiKhac;
  }

  async addTaiLieu(hoSoId: number, data: TaiLieuDto, userId?: number) {
    const hoSo = await this.findOne(hoSoId);
    const loaiTaiLieu = await this.resolveLoaiTaiLieuForHoSo(hoSo.loai_ho_so_id, data.loai_tai_lieu_id);
    const customDocData = this.cleanDynamicDocData(data.du_lieu_dac_thu);

    return this.prisma.$transaction(async (tx) => {
      const taiLieu = await tx.tai_lieu_ho_so.create({
        data: {
          ho_so_chung_id: hoSoId,
          loai_tai_lieu_id: loaiTaiLieu.id,
          ten_tai_lieu: data.ten_tai_lieu.trim(),
          duong_dan_url: data.duong_dan_url.trim(),
          ngay_hieu_luc: data.ngay_hieu_luc ? dateOnly(data.ngay_hieu_luc) : null,
          ngay_het_hieu_luc: data.ngay_het_hieu_luc ? dateOnly(data.ngay_het_hieu_luc) : null,
          ghi_chu: data.ghi_chu?.trim() || null,
          du_lieu_dac_thu: customDocData ? (customDocData as Prisma.InputJsonValue) : Prisma.JsonNull,
          nguoi_tai_len_id: userId || null,
        },
        include: { loai_tai_lieu: true },
      });

      await tx.nhat_ky_ho_so.create({
        data: {
          ho_so_chung_id: hoSoId,
          hanh_dong: 'UPDATE',
          nguoi_thuc_hien_id: userId || null,
          noi_dung: `Đã thêm tài liệu [${loaiTaiLieu.ten_loai_tai_lieu}]: ${taiLieu.ten_tai_lieu}`,
          du_lieu_moi: JSON.stringify(taiLieu),
        },
      });

      return taiLieu;
    });
  }

  async updateTaiLieu(hoSoId: number, taiLieuId: number, data: UpdateTaiLieuDto, userId?: number) {
    const hoSo = await this.findOne(hoSoId);
    const oldDoc = await this.prisma.tai_lieu_ho_so.findUnique({
      where: { id: taiLieuId },
      include: { loai_tai_lieu: true },
    });

    if (!oldDoc || oldDoc.ho_so_chung_id !== hoSoId) {
      throw new NotFoundException('Không tìm thấy tài liệu trong hồ sơ này');
    }

    let nextLoaiTaiLieuId: number | undefined;
    if (data.loai_tai_lieu_id !== undefined && data.loai_tai_lieu_id !== oldDoc.loai_tai_lieu_id) {
      const targetLoai = await this.resolveLoaiTaiLieuForHoSo(hoSo.loai_ho_so_id, data.loai_tai_lieu_id);
      nextLoaiTaiLieuId = targetLoai.id;
    }

    const customDocData =
      data.du_lieu_dac_thu !== undefined ? this.cleanDynamicDocData(data.du_lieu_dac_thu) : undefined;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.tai_lieu_ho_so.update({
        where: { id: taiLieuId },
        data: {
          ...(nextLoaiTaiLieuId !== undefined ? { loai_tai_lieu_id: nextLoaiTaiLieuId } : {}),
          ...(data.ten_tai_lieu !== undefined ? { ten_tai_lieu: data.ten_tai_lieu.trim() } : {}),
          ...(data.duong_dan_url !== undefined ? { duong_dan_url: data.duong_dan_url.trim() } : {}),
          ...(Object.hasOwn(data, 'ngay_hieu_luc')
            ? { ngay_hieu_luc: data.ngay_hieu_luc ? dateOnly(data.ngay_hieu_luc) : null }
            : {}),
          ...(Object.hasOwn(data, 'ngay_het_hieu_luc')
            ? { ngay_het_hieu_luc: data.ngay_het_hieu_luc ? dateOnly(data.ngay_het_hieu_luc) : null }
            : {}),
          ...(Object.hasOwn(data, 'ghi_chu') ? { ghi_chu: data.ghi_chu?.trim() || null } : {}),
          ...(customDocData !== undefined
            ? { du_lieu_dac_thu: customDocData ? (customDocData as Prisma.InputJsonValue) : Prisma.JsonNull }
            : {}),
        },
        include: { loai_tai_lieu: true },
      });

      await tx.nhat_ky_ho_so.create({
        data: {
          ho_so_chung_id: hoSoId,
          hanh_dong: 'UPDATE',
          nguoi_thuc_hien_id: userId || null,
          noi_dung: `Đã cập nhật thông tin tài liệu: ${updated.ten_tai_lieu}`,
          du_lieu_cu: JSON.stringify(oldDoc),
          du_lieu_moi: JSON.stringify(updated),
        },
      });

      return updated;
    });
  }

  async deleteTaiLieu(hoSoId: number, taiLieuId: number, userId?: number) {
    await this.findOne(hoSoId);

    const taiLieu = await this.prisma.tai_lieu_ho_so.findUnique({
      where: { id: taiLieuId },
    });

    if (!taiLieu || taiLieu.ho_so_chung_id !== hoSoId) {
      throw new NotFoundException('Không tìm thấy tài liệu trong hồ sơ này');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.tai_lieu_ho_so.delete({
        where: { id: taiLieuId },
      });

      await tx.nhat_ky_ho_so.create({
        data: {
          ho_so_chung_id: hoSoId,
          hanh_dong: 'UPDATE',
          nguoi_thuc_hien_id: userId || null,
          noi_dung: `Đã xóa tài liệu đính kèm: ${taiLieu.ten_tai_lieu}`,
          du_lieu_cu: JSON.stringify(taiLieu),
        },
      });

      return { message: 'Xóa tài liệu thành công' };
    });
  }

  async replaceTaiLieu(
    hoSoId: number,
    taiLieuId: number,
    data: ReplaceTaiLieuDto,
    userId?: number,
  ) {
    const hoSo = await this.findOne(hoSoId);
    const oldDoc = await this.prisma.tai_lieu_ho_so.findUnique({
      where: { id: taiLieuId },
    });

    if (!oldDoc || oldDoc.ho_so_chung_id !== hoSoId) {
      throw new NotFoundException('Không tìm thấy tài liệu trong hồ sơ này');
    }

    let nextLoaiTaiLieuId = oldDoc.loai_tai_lieu_id;
    if (data.loai_tai_lieu_id !== undefined && data.loai_tai_lieu_id !== oldDoc.loai_tai_lieu_id) {
      const targetLoai = await this.resolveLoaiTaiLieuForHoSo(hoSo.loai_ho_so_id, data.loai_tai_lieu_id);
      nextLoaiTaiLieuId = targetLoai.id;
    }

    const customDocData =
      data.du_lieu_dac_thu !== undefined
        ? this.cleanDynamicDocData(data.du_lieu_dac_thu)
        : this.cleanDynamicDocData(oldDoc.du_lieu_dac_thu as Record<string, any> | null);

    const nextNgayHieuLuc =
      data.ngay_hieu_luc !== undefined
        ? (data.ngay_hieu_luc ? dateOnly(data.ngay_hieu_luc) : null)
        : new Date();
    const nextNgayHetHieuLuc =
      data.ngay_het_hieu_luc !== undefined
        ? (data.ngay_het_hieu_luc ? dateOnly(data.ngay_het_hieu_luc) : null)
        : oldDoc.ngay_het_hieu_luc;

    return this.prisma.$transaction(async (tx) => {
      const updatedOldDoc = await tx.tai_lieu_ho_so.update({
        where: { id: taiLieuId },
        data: {
          tai_lieu_hien_hanh: false,
          ngay_het_hieu_luc: new Date(),
          ghi_chu: oldDoc.ghi_chu
            ? `${oldDoc.ghi_chu} (Đã thay thế bởi phiên bản v${oldDoc.so_phien_ban + 1})`
            : `Đã thay thế bởi phiên bản v${oldDoc.so_phien_ban + 1}`,
        },
      });

      const newDoc = await tx.tai_lieu_ho_so.create({
        data: {
          ho_so_chung_id: hoSoId,
          loai_tai_lieu_id: nextLoaiTaiLieuId,
          ten_tai_lieu: data.ten_tai_lieu?.trim() || oldDoc.ten_tai_lieu,
          duong_dan_url: data.duong_dan_url.trim(),
          so_phien_ban: oldDoc.so_phien_ban + 1,
          tai_lieu_hien_hanh: true,
          ngay_hieu_luc: nextNgayHieuLuc,
          ngay_het_hieu_luc: nextNgayHetHieuLuc,
          ghi_chu: data.ghi_chu !== undefined
            ? (data.ghi_chu?.trim() || null)
            : `Bản thay thế cho phiên bản v${oldDoc.so_phien_ban}`,
          du_lieu_dac_thu: customDocData ? (customDocData as Prisma.InputJsonValue) : Prisma.JsonNull,
          nguoi_tai_len_id: userId || null,
        },
        include: { loai_tai_lieu: true },
      });

      await tx.nhat_ky_ho_so.create({
        data: {
          ho_so_chung_id: hoSoId,
          hanh_dong: 'UPDATE',
          nguoi_thuc_hien_id: userId || null,
          noi_dung: `Đã upload thay thế tài liệu '${oldDoc.ten_tai_lieu}' (v${oldDoc.so_phien_ban} -> v${newDoc.so_phien_ban})`,
          du_lieu_cu: JSON.stringify(oldDoc),
          du_lieu_moi: JSON.stringify(newDoc),
        },
      });

      return { oldDoc: updatedOldDoc, newDoc };
    });
  }
}
