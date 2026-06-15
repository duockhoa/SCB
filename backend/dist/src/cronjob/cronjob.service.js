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
var CronjobService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronjobService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
let CronjobService = CronjobService_1 = class CronjobService {
    prisma;
    logger = new common_1.Logger(CronjobService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handleExpirationCheck() {
        this.logger.log('Bắt đầu kiểm tra hồ sơ hết hạn và nhắc hạn...');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const hoSosCanNhac = await this.prisma.ho_so_chung.findMany({
            where: {
                ngay_nhac_han: { lte: today },
                tinh_trang: { ma_tinh_trang: 'CON_HIEU_LUC' }
            },
            include: { tinh_trang: true }
        });
        if (hoSosCanNhac.length > 0) {
            const ttSapHetHan = await this.prisma.dm_tinh_trang.findFirst({ where: { ma_tinh_trang: 'SAP_HET_HAN' } });
            if (ttSapHetHan) {
                for (const hs of hoSosCanNhac) {
                    await this.prisma.$transaction(async (tx) => {
                        await tx.ho_so_chung.update({
                            where: { id: hs.id },
                            data: { tinh_trang_id: ttSapHetHan.id }
                        });
                        await tx.nhac_han_ho_so.create({
                            data: {
                                ho_so_chung_id: hs.id,
                                loai_nhac: 'SAP_HET_HAN',
                                ngay_nhac: new Date(),
                                noi_dung: `Hồ sơ ${hs.ma_ho_so} (Số công bố: ${hs.so_chinh}) đã đến hạn nhắc nhở.`
                            }
                        });
                    });
                    this.logger.log(`Đã chuyển trạng thái hồ sơ ${hs.id} sang Sắp hết hạn.`);
                }
            }
        }
        const hoSosDaHetHan = await this.prisma.ho_so_chung.findMany({
            where: {
                ngay_het_han: { lt: today },
                tinh_trang: { ma_tinh_trang: { in: ['CON_HIEU_LUC', 'SAP_HET_HAN'] } }
            }
        });
        if (hoSosDaHetHan.length > 0) {
            const ttDaHetHan = await this.prisma.dm_tinh_trang.findFirst({ where: { ma_tinh_trang: 'DA_HET_HAN' } });
            if (ttDaHetHan) {
                for (const hs of hoSosDaHetHan) {
                    await this.prisma.ho_so_chung.update({
                        where: { id: hs.id },
                        data: { tinh_trang_id: ttDaHetHan.id }
                    });
                    this.logger.log(`Đã chuyển trạng thái hồ sơ ${hs.id} sang Đã hết hạn.`);
                }
            }
        }
        this.logger.log('Hoàn thành kiểm tra nhắc hạn hồ sơ.');
    }
};
exports.CronjobService = CronjobService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CronjobService.prototype, "handleExpirationCheck", null);
exports.CronjobService = CronjobService = CronjobService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CronjobService);
//# sourceMappingURL=cronjob.service.js.map