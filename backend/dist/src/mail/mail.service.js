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
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const mailer_1 = require("@nestjs-modules/mailer");
const recipient_service_1 = require("./recipient.service");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto_util_1 = require("../common/utils/crypto.util");
const nodemailer = __importStar(require("nodemailer"));
let MailService = MailService_1 = class MailService {
    mailerService;
    recipientService;
    prisma;
    logger = new common_1.Logger(MailService_1.name);
    constructor(mailerService, recipientService, prisma) {
        this.mailerService = mailerService;
        this.recipientService = recipientService;
        this.prisma = prisma;
    }
    async handleHoSoEvents(data) {
        try {
            const eventName = data.eventName || 'HO_SO_UPDATED';
            this.logger.log(`Received event ${eventName} for Ho So ${data.ma_ho_so}`);
            const emails = await this.recipientService.getRecipientsForEvent(eventName, data);
            if (!emails || emails.length === 0) {
                this.logger.log(`No recipients found for event ${eventName}. Skipping email.`);
                return;
            }
            let subject = `[Hệ thống SCB] Thông báo: ${eventName}`;
            let content = `Hồ sơ ${data.ma_ho_so} - ${data.ten_san_pham} vừa có cập nhật mới.\n`;
            if (eventName === 'HO_SO_CREATED') {
                subject = `[Hệ thống SCB] Hồ sơ mới được tạo: ${data.ma_ho_so}`;
                content = `Hồ sơ mới: ${data.ma_ho_so} - ${data.ten_san_pham} vừa được tạo trên hệ thống.\n`;
            }
            else if (eventName === 'HO_SO_UPDATED') {
                subject = `[Hệ thống SCB] Cập nhật Hồ Sơ: ${data.ma_ho_so}`;
                content = `Hồ sơ ${data.ma_ho_so} - ${data.ten_san_pham} vừa được cập nhật.\n`;
            }
            else if (eventName === 'HO_SO_SAP_HET_HAN') {
                subject = `[Hệ thống SCB] Cảnh báo: Hồ sơ sắp hết hạn (${data.ma_ho_so})`;
                content = `Hồ sơ ${data.ma_ho_so} - ${data.ten_san_pham} sắp hết hạn.\n`;
            }
            else if (eventName === 'HO_SO_THAY_THE') {
                subject = `[Hệ thống SCB] Hồ sơ đã được thay thế: ${data.ma_ho_so}`;
            }
            else if (eventName === 'HO_SO_GIA_HAN') {
                subject = `[Hệ thống SCB] Hồ sơ được gia hạn: ${data.ma_ho_so}`;
            }
            if (data.action === 'THAY_DOI') {
                subject = `[Hệ thống SCB] Thay đổi thông tin: ${data.ma_ho_so}`;
                content = `Hồ sơ ${data.ma_ho_so} vừa có cập nhật: ${data.noi_dung || 'N/A'}.\n`;
            }
            else if (data.action === 'UPDATE_LICH_SU') {
                subject = `[Hệ thống SCB] Cập nhật tình trạng thay đổi: ${data.ma_ho_so}`;
                content = `Lịch sử thay đổi của hồ sơ ${data.ma_ho_so} vừa được cập nhật.\n`;
            }
            const timeStr = new Date(data.time || new Date()).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
            content += `\nThời gian: ${timeStr}`;
            content += `\n\nVui lòng đăng nhập hệ thống để xem chi tiết.`;
            let useDbSmtp = false;
            const smtpConfig = await this.prisma.cau_hinh_smtp.findFirst({ where: { is_active: true } });
            if (smtpConfig && smtpConfig.pass) {
                try {
                    const decryptedPass = (0, crypto_util_1.decryptString)(smtpConfig.pass);
                    const transporter = nodemailer.createTransport({
                        host: smtpConfig.host,
                        port: smtpConfig.port,
                        secure: smtpConfig.secure,
                        auth: {
                            user: smtpConfig.user,
                            pass: decryptedPass,
                        },
                    });
                    await transporter.sendMail({
                        from: smtpConfig.from_email,
                        to: emails,
                        subject: subject,
                        text: content,
                    });
                    useDbSmtp = true;
                    this.logger.log(`Email sent successfully via DB SMTP to ${emails.length} recipients.`);
                }
                catch (dbSmtpError) {
                    this.logger.error(`DB SMTP Config failed, falling back to ENV config: ${dbSmtpError.message}`);
                }
            }
            if (!useDbSmtp) {
                await this.mailerService.sendMail({
                    to: emails,
                    subject: subject,
                    text: content,
                });
                this.logger.log(`Email sent successfully via ENV SMTP to ${emails.length} recipients.`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to send email for event: ${error.message}`);
        }
    }
};
exports.MailService = MailService;
__decorate([
    (0, event_emitter_1.OnEvent)('hoSo.*', { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MailService.prototype, "handleHoSoEvents", null);
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mailer_1.MailerService,
        recipient_service_1.RecipientService,
        prisma_service_1.PrismaService])
], MailService);
//# sourceMappingURL=mail.service.js.map