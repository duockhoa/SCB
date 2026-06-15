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
exports.CongTyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CongTyService = class CongTyService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.dm_cong_ty.findMany({
            orderBy: { created_at: 'desc' }
        });
    }
    async findOne(id) {
        const congTy = await this.prisma.dm_cong_ty.findUnique({ where: { id } });
        if (!congTy)
            throw new common_1.NotFoundException('Không tìm thấy công ty');
        return congTy;
    }
    async create(data) {
        const exists = await this.prisma.dm_cong_ty.findUnique({
            where: { ma_cong_ty: data.ma_cong_ty }
        });
        if (exists)
            throw new common_1.ConflictException('Mã công ty đã tồn tại');
        return this.prisma.dm_cong_ty.create({ data });
    }
    async update(id, data) {
        await this.findOne(id);
        if (data.ma_cong_ty) {
            const exists = await this.prisma.dm_cong_ty.findFirst({
                where: { ma_cong_ty: data.ma_cong_ty, id: { not: id } }
            });
            if (exists)
                throw new common_1.ConflictException('Mã công ty đã tồn tại');
        }
        return this.prisma.dm_cong_ty.update({
            where: { id },
            data,
        });
    }
    async remove(id) {
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
            throw new common_1.ConflictException('Không thể xóa công ty đã được sử dụng trong hồ sơ. Hãy đổi trạng thái thành Không hoạt động.');
        }
        await this.prisma.dm_cong_ty.delete({ where: { id } });
        return { message: 'Xóa thành công' };
    }
};
exports.CongTyService = CongTyService;
exports.CongTyService = CongTyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CongTyService);
//# sourceMappingURL=cong-ty.service.js.map