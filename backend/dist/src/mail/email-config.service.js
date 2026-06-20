"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailConfigService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailConfigService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto_util_1 = require("../common/utils/crypto.util");
const nodemailer = __importStar(require("nodemailer"));
let EmailConfigService = EmailConfigService_1 = class EmailConfigService {
    prisma;
    logger = new common_1.Logger(EmailConfigService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSmtpConfig() {
        const config = await this.prisma.cau_hinh_smtp.findFirst();
        if (!config)
            return null;
        return {
            id: config.id,
            host: config.host,
            port: config.port,
            secure: config.secure,
            user: config.user,
            from_email: config.from_email,
            is_active: config.is_active,
            pass_configured: !!config.pass,
        };
    }
    async saveSmtpConfig(data) {
        if (!process.env.EMAIL_CONFIG_SECRET_KEY) {
            throw new common_1.BadRequestException('EMAIL_CONFIG_SECRET_KEY is not defined in environment variables. Cannot save SMTP configuration securely.');
        }
        const currentConfig = await this.prisma.cau_hinh_smtp.findFirst();
        let passwordToSave = currentConfig?.pass || '';
        if (data.pass) {
            passwordToSave = (0, crypto_util_1.encryptString)(data.pass);
        }
        const payload = {
            host: data.host,
            port: Number(data.port),
            secure: Boolean(data.secure),
            user: data.user,
            from_email: data.from_email,
            is_active: Boolean(data.is_active),
            pass: passwordToSave,
        };
        if (currentConfig) {
            return this.prisma.cau_hinh_smtp.update({
                where: { id: currentConfig.id },
                data: payload,
            });
        }
        else {
            if (!data.pass) {
                throw new common_1.BadRequestException('Password is required for the first time setup');
            }
            return this.prisma.cau_hinh_smtp.create({
                data: payload,
            });
        }
    }
    async testSmtpConnection(testEmail) {
        const config = await this.prisma.cau_hinh_smtp.findFirst({ where: { is_active: true } });
        if (!config) {
            throw new common_1.BadRequestException('No active SMTP configuration found in the database');
        }
        if (!process.env.EMAIL_CONFIG_SECRET_KEY) {
            throw new common_1.BadRequestException('EMAIL_CONFIG_SECRET_KEY is not defined');
        }
        let decryptedPass = '';
        try {
            decryptedPass = (0, crypto_util_1.decryptString)(config.pass);
        }
        catch (e) {
            throw new common_1.BadRequestException('Failed to decrypt SMTP password. Secret key might have changed.');
        }
        const transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: {
                user: config.user,
                pass: decryptedPass,
            },
        });
        try {
            await transporter.sendMail({
                from: config.from_email,
                to: testEmail,
                subject: '[Hệ thống SCB] Test Gửi Mail',
                text: 'Nếu bạn nhận được email này, cấu hình SMTP của bạn đã hoạt động bình thường.',
            });
            return { success: true, message: 'Gửi mail test thành công' };
        }
        catch (error) {
            this.logger.error(`Failed to send test email: ${error.message}`);
            throw new common_1.BadRequestException(`Gửi mail test thất bại: ${error.message}`);
        }
    }
    async getRecipients() {
        return this.prisma.cau_hinh_gui_mail.findMany({
            where: { ma_su_kien: 'GLOBAL_EMAIL' },
            orderBy: { created_at: 'desc' }
        });
    }
    async addRecipient(data) {
        return this.prisma.cau_hinh_gui_mail.create({
            data: {
                ma_su_kien: 'GLOBAL_EMAIL',
                loai_dieu_kien: 'EMAIL_CU_THE',
                gia_tri: data.gia_tri,
                trang_thai: true,
            }
        });
    }
    async updateRecipient(id, data) {
        return this.prisma.cau_hinh_gui_mail.update({
            where: { id },
            data: { gia_tri: data.gia_tri }
        });
    }
    async deleteRecipient(id) {
        return this.prisma.cau_hinh_gui_mail.delete({
            where: { id }
        });
    }
    async getEvents() {
        const events = await this.prisma.cau_hinh_gui_mail.findMany({
            where: { ma_su_kien: 'EVENT_TOGGLE', trang_thai: true }
        });
        return events.map(e => e.loai_dieu_kien);
    }
    async saveEvents(data) {
        await this.prisma.cau_hinh_gui_mail.deleteMany({
            where: { ma_su_kien: 'EVENT_TOGGLE' }
        });
        if (data.events && data.events.length > 0) {
            const records = data.events.map(event => ({
                ma_su_kien: 'EVENT_TOGGLE',
                loai_dieu_kien: event,
                gia_tri: 'true',
                trang_thai: true
            }));
            await this.prisma.cau_hinh_gui_mail.createMany({ data: records });
        }
        return { success: true };
    }
};
exports.EmailConfigService = EmailConfigService;
exports.EmailConfigService = EmailConfigService = EmailConfigService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmailConfigService);
//# sourceMappingURL=email-config.service.js.map