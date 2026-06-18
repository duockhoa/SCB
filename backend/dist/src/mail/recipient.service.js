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
var RecipientService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipientService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RecipientService = RecipientService_1 = class RecipientService {
    prisma;
    logger = new common_1.Logger(RecipientService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getRecipientsForEvent(eventName, context) {
        try {
            const configs = await this.prisma.cau_hinh_gui_mail.findMany({
                where: { ma_su_kien: eventName, trang_thai: true },
            });
            if (configs.length === 0) {
                return [];
            }
            const emails = new Set();
            for (const config of configs) {
                switch (config.loai_dieu_kien) {
                    case 'EMAIL_CU_THE':
                        if (config.gia_tri)
                            emails.add(config.gia_tri);
                        break;
                    case 'NGUOI_PHU_TRACH':
                        if (context?.ownerId) {
                            const user = await this.prisma.nguoi_dung.findUnique({
                                where: { id: context.ownerId },
                            });
                            if (user?.email)
                                emails.add(user.email);
                        }
                        break;
                    case 'ROLE':
                        if (config.gia_tri) {
                            const users = await this.prisma.nguoi_dung.findMany({
                                where: {
                                    vai_tro: { ma_vai_tro: config.gia_tri },
                                    trang_thai: true,
                                },
                            });
                            users.forEach(u => emails.add(u.email));
                        }
                        break;
                    case 'PHONG_BAN':
                        if (config.gia_tri) {
                            const users = await this.prisma.nguoi_dung.findMany({
                                where: {
                                    phong_ban: config.gia_tri,
                                    trang_thai: true,
                                },
                            });
                            users.forEach(u => emails.add(u.email));
                        }
                        break;
                    default:
                        this.logger.warn(`Unknown condition type: ${config.loai_dieu_kien}`);
                        break;
                }
            }
            return Array.from(emails);
        }
        catch (error) {
            this.logger.error(`Error resolving recipients: ${error.message}`);
            return [];
        }
    }
};
exports.RecipientService = RecipientService;
exports.RecipientService = RecipientService = RecipientService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RecipientService);
//# sourceMappingURL=recipient.service.js.map