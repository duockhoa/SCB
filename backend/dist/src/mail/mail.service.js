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
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const mailer_1 = require("@nestjs-modules/mailer");
const recipient_service_1 = require("./recipient.service");
let MailService = MailService_1 = class MailService {
    mailerService;
    recipientService;
    logger = new common_1.Logger(MailService_1.name);
    constructor(mailerService, recipientService) {
        this.mailerService = mailerService;
        this.recipientService = recipientService;
    }
    async handleHoSoUpdatedEvent(data) {
        try {
            this.logger.log(`Received hoSo.updated event for Ho So ${data.ma_ho_so}`);
            const emails = await this.recipientService.getRecipientsForEvent('hoSo.updated', data);
            if (!emails || emails.length === 0) {
                this.logger.log(`No recipients found for event hoSo.updated. Skipping email.`);
                return;
            }
            let subject = '[Hệ thống SCB] Cập nhật Hồ Sơ';
            let content = `Hồ sơ ${data.ma_ho_so} - ${data.ten_san_pham} vừa được cập nhật.\n`;
            if (data.action === 'THAY_DOI') {
                subject = `[Hệ thống SCB] Thay đổi thông tin: ${data.ma_ho_so}`;
                content = `Hồ sơ ${data.ma_ho_so} vừa có cập nhật: ${data.noi_dung || 'N/A'}.\n`;
            }
            else if (data.action === 'UPDATE_LICH_SU') {
                subject = `[Hệ thống SCB] Cập nhật tình trạng thay đổi: ${data.ma_ho_so}`;
                content = `Lịch sử thay đổi của hồ sơ ${data.ma_ho_so} vừa được cập nhật.\n`;
            }
            const timeStr = new Date(data.time).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
            content += `\nThời gian: ${timeStr}`;
            content += `\n\nVui lòng đăng nhập hệ thống để xem chi tiết.`;
            await this.mailerService.sendMail({
                to: emails,
                subject: subject,
                text: content,
            });
            this.logger.log(`Email sent successfully to ${emails.length} recipients.`);
        }
        catch (error) {
            this.logger.error(`Failed to send email for hoSo.updated: ${error.message}`);
        }
    }
};
exports.MailService = MailService;
__decorate([
    (0, event_emitter_1.OnEvent)('hoSo.updated', { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MailService.prototype, "handleHoSoUpdatedEvent", null);
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mailer_1.MailerService,
        recipient_service_1.RecipientService])
], MailService);
//# sourceMappingURL=mail.service.js.map