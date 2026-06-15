"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HoSoService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let HoSoService = class HoSoService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const { search, loai_ho_so, tinh_trang, cong_ty_id, ngay_het_han_from, ngay_het_han_to, page = 1, limit = 10 } = query;
        const where = {};
        if (search) {
            where.OR = [
                { ma_ho_so: { contains: search } },
                { so_chinh: { contains: search } },
                { ten_san_pham: { contains: search } },
                { ten_san_pham_khong_dau: { contains: search } },
                { ma_san_pham_noi_bo: { contains: search } }
            ];
        }
        if (loai_ho_so)
            where.loai_ho_so_id = Number(loai_ho_so);
        if (tinh_trang)
            where.tinh_trang_id = Number(tinh_trang);
        if (cong_ty_id) {
            const cid = Number(cong_ty_id);
            where.OR = [
                ...(where.OR ? where.OR : []),
                { cong_ty_so_huu_id: cid },
                { cong_ty_dung_ten_id: cid },
                { cong_ty_phan_phoi_id: cid }
            ];
        }
        if (ngay_het_han_from || ngay_het_han_to) {
            where.ngay_het_han = {};
            if (ngay_het_han_from)
                where.ngay_het_han.gte = new Date(ngay_het_han_from);
            if (ngay_het_han_to)
                where.ngay_het_han.lte = new Date(ngay_het_han_to);
        }
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
    async findOne(id) {
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
                tai_lieu: true,
                lich_su_thay_doi: true,
                nhat_ky: { orderBy: { created_at: 'desc' } }
            }
        });
        if (!hoSo)
            throw new common_1.NotFoundException('Không tìm thấy hồ sơ');
        return hoSo;
    }
    async create(data) {
        const { thong_tin_rieng, nguoi_thuc_hien_id, ...chungData } = data;
        const exists = await this.prisma.ho_so_chung.findUnique({ where: { ma_ho_so: data.ma_ho_so } });
        if (exists)
            throw new common_1.ConflictException('Mã hồ sơ đã tồn tại');
        const loaiHoSo = await this.prisma.dm_loai_ho_so.findUnique({ where: { id: data.loai_ho_so_id } });
        if (!loaiHoSo)
            throw new common_1.NotFoundException('Không tìm thấy loại hồ sơ');
        return this.prisma.$transaction(async (tx) => {
            const hoSoChung = await tx.ho_so_chung.create({
                data: {
                    ...chungData,
                    ngay_cong_bo: chungData.ngay_cong_bo ? new Date(chungData.ngay_cong_bo) : null,
                    ngay_het_han: chungData.ngay_het_han ? new Date(chungData.ngay_het_han) : null,
                }
            });
            if (thong_tin_rieng) {
                const maLoai = loaiHoSo.ma_loai;
                if (maLoai === 'THUOC')
                    await tx.ho_so_thuoc.create({ data: { ho_so_chung_id: hoSoChung.id, ...thong_tin_rieng } });
                else if (maLoai === 'MY_PHAM')
                    await tx.ho_so_my_pham.create({ data: { ho_so_chung_id: hoSoChung.id, ...thong_tin_rieng } });
                else if (maLoai === 'TBYT')
                    await tx.ho_so_tbyt.create({ data: { ho_so_chung_id: hoSoChung.id, ...thong_tin_rieng } });
                else if (maLoai === 'TPBVSK_TU_CONG_BO')
                    await tx.ho_so_tpbvsk_tu_cong_bo.create({ data: { ho_so_chung_id: hoSoChung.id, ...thong_tin_rieng } });
                else if (maLoai === 'TPBVSK_CONG_BO')
                    await tx.ho_so_tpbvsk_cong_bo.create({ data: { ho_so_chung_id: hoSoChung.id, ...thong_tin_rieng } });
                else if (maLoai === 'CFS_CPP')
                    await tx.ho_so_cfs_cpp.create({ data: { ho_so_chung_id: hoSoChung.id, ...thong_tin_rieng } });
            }
            await tx.nhat_ky_ho_so.create({
                data: {
                    ho_so_chung_id: hoSoChung.id,
                    hanh_dong: 'CREATE',
                    nguoi_thuc_hien_id: nguoi_thuc_hien_id || null,
                    noi_dung: `Tạo mới hồ sơ ${chungData.ma_ho_so}`,
                    du_lieu_cu: null,
                    du_lieu_moi: JSON.stringify({ chung: chungData, rieng: thong_tin_rieng })
                }
            });
            return hoSoChung;
        });
    }
    async update(id, data) {
        const hoSo = await this.findOne(id);
        const { thong_tin_rieng, nguoi_thuc_hien_id, ...chungData } = data;
        if (data.ma_ho_so) {
            const exists = await this.prisma.ho_so_chung.findFirst({
                where: { ma_ho_so: data.ma_ho_so, id: { not: id } }
            });
            if (exists)
                throw new common_1.ConflictException('Mã hồ sơ đã tồn tại');
        }
        return this.prisma.$transaction(async (tx) => {
            const updatedChung = await tx.ho_so_chung.update({
                where: { id },
                data: {
                    ...chungData,
                    ngay_cong_bo: chungData.ngay_cong_bo ? new Date(chungData.ngay_cong_bo) : undefined,
                    ngay_het_han: chungData.ngay_het_han ? new Date(chungData.ngay_het_han) : undefined,
                }
            });
            if (thong_tin_rieng) {
                const maLoai = hoSo.loai_ho_so.ma_loai;
                if (maLoai === 'THUOC')
                    await tx.ho_so_thuoc.update({ where: { ho_so_chung_id: id }, data: thong_tin_rieng }).catch(() => tx.ho_so_thuoc.create({ data: { ho_so_chung_id: id, ...thong_tin_rieng } }));
                else if (maLoai === 'MY_PHAM')
                    await tx.ho_so_my_pham.update({ where: { ho_so_chung_id: id }, data: thong_tin_rieng }).catch(() => tx.ho_so_my_pham.create({ data: { ho_so_chung_id: id, ...thong_tin_rieng } }));
                else if (maLoai === 'TBYT')
                    await tx.ho_so_tbyt.update({ where: { ho_so_chung_id: id }, data: thong_tin_rieng }).catch(() => tx.ho_so_tbyt.create({ data: { ho_so_chung_id: id, ...thong_tin_rieng } }));
                else if (maLoai === 'TPBVSK_TU_CONG_BO')
                    await tx.ho_so_tpbvsk_tu_cong_bo.update({ where: { ho_so_chung_id: id }, data: thong_tin_rieng }).catch(() => tx.ho_so_tpbvsk_tu_cong_bo.create({ data: { ho_so_chung_id: id, ...thong_tin_rieng } }));
                else if (maLoai === 'TPBVSK_CONG_BO')
                    await tx.ho_so_tpbvsk_cong_bo.update({ where: { ho_so_chung_id: id }, data: thong_tin_rieng }).catch(() => tx.ho_so_tpbvsk_cong_bo.create({ data: { ho_so_chung_id: id, ...thong_tin_rieng } }));
                else if (maLoai === 'CFS_CPP')
                    await tx.ho_so_cfs_cpp.update({ where: { ho_so_chung_id: id }, data: thong_tin_rieng }).catch(() => tx.ho_so_cfs_cpp.create({ data: { ho_so_chung_id: id, ...thong_tin_rieng } }));
            }
            await tx.nhat_ky_ho_so.create({
                data: {
                    ho_so_chung_id: id,
                    hanh_dong: 'UPDATE',
                    nguoi_thuc_hien_id: nguoi_thuc_hien_id || null,
                    noi_dung: `Cập nhật hồ sơ ${updatedChung.ma_ho_so}`,
                    du_lieu_cu: JSON.stringify(hoSo),
                    du_lieu_moi: JSON.stringify({ chung: chungData, rieng: thong_tin_rieng })
                }
            });
            return updatedChung;
        });
    }
    async capSo(id, data) {
        const hoSo = await this.findOne(id);
        const ttConHieuLuc = await this.prisma.dm_tinh_trang.findFirst({ where: { ma_tinh_trang: 'CON_HIEU_LUC' } });
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.ho_so_chung.update({
                where: { id },
                data: {
                    so_chinh: data.so_chinh,
                    ngay_cong_bo: new Date(data.ngay_cong_bo),
                    ngay_het_han: data.ngay_het_han ? new Date(data.ngay_het_han) : null,
                    ngay_nhac_han: data.ngay_nhac_han ? new Date(data.ngay_nhac_han) : null,
                    tinh_trang_id: ttConHieuLuc?.id || hoSo.tinh_trang_id
                }
            });
            await tx.nhat_ky_ho_so.create({
                data: {
                    ho_so_chung_id: id,
                    hanh_dong: 'CAP_SO',
                    noi_dung: `Cấp số công bố ${data.so_chinh} cho hồ sơ`,
                    du_lieu_cu: JSON.stringify({ so_chinh: hoSo.so_chinh, tinh_trang_id: hoSo.tinh_trang_id }),
                    du_lieu_moi: JSON.stringify({ so_chinh: data.so_chinh, tinh_trang_id: ttConHieuLuc?.id })
                }
            });
            return updated;
        });
    }
    async giaHan(id, data) {
        const hoSo = await this.findOne(id);
        const ttConHieuLuc = await this.prisma.dm_tinh_trang.findFirst({ where: { ma_tinh_trang: 'CON_HIEU_LUC' } });
        let loaiThayDoi = await this.prisma.dm_loai_thay_doi.findFirst({ where: { ma_loai_thay_doi: 'GIA_HAN' } });
        if (!loaiThayDoi) {
            loaiThayDoi = await this.prisma.dm_loai_thay_doi.create({ data: { ma_loai_thay_doi: 'GIA_HAN', ten_loai_thay_doi: 'Gia hạn' } });
        }
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.ho_so_chung.update({
                where: { id },
                data: {
                    ngay_het_han: new Date(data.ngay_het_han),
                    ngay_nhac_han: data.ngay_nhac_han ? new Date(data.ngay_nhac_han) : null,
                    tinh_trang_id: ttConHieuLuc?.id || hoSo.tinh_trang_id
                }
            });
            await tx.lich_su_thay_doi_ho_so.create({
                data: {
                    ho_so_chung_id: id,
                    lan_thu: hoSo.lich_su_thay_doi.length + 1,
                    loai_thay_doi_id: loaiThayDoi.id,
                    noi_dung_thay_doi: `Gia hạn đến ngày ${data.ngay_het_han}`,
                    ghi_chu: `Ngày hết hạn cũ: ${hoSo.ngay_het_han}`,
                    ngay_thay_doi: new Date()
                }
            });
            await tx.nhat_ky_ho_so.create({
                data: {
                    ho_so_chung_id: id,
                    hanh_dong: 'GIA_HAN',
                    noi_dung: `Gia hạn số công bố ${hoSo.so_chinh}`,
                    du_lieu_cu: JSON.stringify({ ngay_het_han: hoSo.ngay_het_han }),
                    du_lieu_moi: JSON.stringify({ ngay_het_han: data.ngay_het_han })
                }
            });
            return updated;
        });
    }
    async thayThe(id, data) {
        const hoSoCu = await this.findOne(id);
        const ttDaThayThe = await this.prisma.dm_tinh_trang.findFirst({ where: { ma_tinh_trang: 'DA_THAY_THE' } });
        if (!ttDaThayThe) {
            await this.prisma.dm_tinh_trang.create({ data: { ma_tinh_trang: 'DA_THAY_THE', ten_tinh_trang: 'Đã bị thay thế' } });
        }
        const ttDaThayTheMoi = await this.prisma.dm_tinh_trang.findFirst({ where: { ma_tinh_trang: 'DA_THAY_THE' } });
        const ttConHieuLuc = await this.prisma.dm_tinh_trang.findFirst({ where: { ma_tinh_trang: 'CON_HIEU_LUC' } });
        return this.prisma.$transaction(async (tx) => {
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
                    ngay_het_han: data.ngay_het_han ? new Date(data.ngay_het_han) : null,
                    ngay_nhac_han: data.ngay_nhac_han ? new Date(data.ngay_nhac_han) : null,
                    tinh_trang_id: ttConHieuLuc?.id,
                    ho_so_cu_id: hoSoCu.id
                }
            });
            await tx.ho_so_chung.update({
                where: { id: hoSoCu.id },
                data: { tinh_trang_id: ttDaThayTheMoi?.id }
            });
            await tx.nhat_ky_ho_so.create({
                data: {
                    ho_so_chung_id: hoSoCu.id,
                    hanh_dong: 'THAY_THE',
                    noi_dung: `Đã thay thế bằng hồ sơ mới ${hoSoMoi.ma_ho_so}`,
                }
            });
            return hoSoMoi;
        });
    }
    async remove(id) {
        const hoSo = await this.findOne(id);
        await this.prisma.ho_so_chung.delete({ where: { id } });
        return { message: 'Xóa thành công' };
    }
};
exports.HoSoService = HoSoService;
exports.HoSoService = HoSoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HoSoService);
//# sourceMappingURL=ho-so.service.js.map