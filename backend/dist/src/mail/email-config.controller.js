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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailConfigController = void 0;
const common_1 = require("@nestjs/common");
const email_config_service_1 = require("./email-config.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const swagger_1 = require("@nestjs/swagger");
const prisma_service_1 = require("../prisma/prisma.service");
let EmailConfigController = class EmailConfigController {
    emailConfigService;
    prisma;
    constructor(emailConfigService, prisma) {
        this.emailConfigService = emailConfigService;
        this.prisma = prisma;
    }
    checkManagePermission(req) {
        if (!req.user)
            throw new common_1.ForbiddenException('Chưa đăng nhập');
        return true;
    }
    async getSmtp(req) {
        this.checkManagePermission(req);
        return this.emailConfigService.getSmtpConfig();
    }
    async saveSmtp(req, data) {
        this.checkManagePermission(req);
        return this.emailConfigService.saveSmtpConfig(data);
    }
    async testSmtp(req, body) {
        this.checkManagePermission(req);
        return this.emailConfigService.testSmtpConnection(body.test_email);
    }
    async getRecipients(req) {
        this.checkManagePermission(req);
        return this.emailConfigService.getRecipients();
    }
    async addRecipient(req, data) {
        this.checkManagePermission(req);
        return this.emailConfigService.addRecipient(data);
    }
    async updateRecipient(req, id, data) {
        this.checkManagePermission(req);
        return this.emailConfigService.updateRecipient(Number(id), data);
    }
    async deleteRecipient(req, id) {
        this.checkManagePermission(req);
        return this.emailConfigService.deleteRecipient(Number(id));
    }
    async getEvents(req) {
        this.checkManagePermission(req);
        return this.emailConfigService.getEvents();
    }
    async saveEvents(req, data) {
        this.checkManagePermission(req);
        return this.emailConfigService.saveEvents(data);
    }
};
exports.EmailConfigController = EmailConfigController;
__decorate([
    (0, common_1.Get)('smtp'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy cấu hình SMTP hiện tại (không trả về pass)' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailConfigController.prototype, "getSmtp", null);
__decorate([
    (0, common_1.Post)('smtp'),
    (0, swagger_1.ApiOperation)({ summary: 'Lưu hoặc cập nhật cấu hình SMTP' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EmailConfigController.prototype, "saveSmtp", null);
__decorate([
    (0, common_1.Post)('smtp/test'),
    (0, swagger_1.ApiOperation)({ summary: 'Gửi email test nghiệm thu cấu hình' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EmailConfigController.prototype, "testSmtp", null);
__decorate([
    (0, common_1.Get)('recipients'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách cấu hình nhận mail (simplified)' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailConfigController.prototype, "getRecipients", null);
__decorate([
    (0, common_1.Post)('recipients'),
    (0, swagger_1.ApiOperation)({ summary: 'Thêm người nhận mail' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EmailConfigController.prototype, "addRecipient", null);
__decorate([
    (0, common_1.Put)('recipients/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Cập nhật người nhận mail' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], EmailConfigController.prototype, "updateRecipient", null);
__decorate([
    (0, common_1.Delete)('recipients/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Xóa người nhận mail' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EmailConfigController.prototype, "deleteRecipient", null);
__decorate([
    (0, common_1.Get)('events'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách các sự kiện được bật gửi mail' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailConfigController.prototype, "getEvents", null);
__decorate([
    (0, common_1.Post)('events'),
    (0, swagger_1.ApiOperation)({ summary: 'Lưu cấu hình sự kiện gửi mail' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EmailConfigController.prototype, "saveEvents", null);
exports.EmailConfigController = EmailConfigController = __decorate([
    (0, swagger_1.ApiTags)('Email Config'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('email-config'),
    __metadata("design:paramtypes", [email_config_service_1.EmailConfigService,
        prisma_service_1.PrismaService])
], EmailConfigController);
//# sourceMappingURL=email-config.controller.js.map