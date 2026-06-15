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
exports.DanhMucService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DanhMucService = class DanhMucService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
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
};
exports.DanhMucService = DanhMucService;
exports.DanhMucService = DanhMucService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DanhMucService);
//# sourceMappingURL=danh-muc.service.js.map