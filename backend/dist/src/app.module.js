"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const danh_muc_module_1 = require("./danh-muc/danh-muc.module");
const cong_ty_module_1 = require("./cong-ty/cong-ty.module");
const ho_so_module_1 = require("./ho-so/ho-so.module");
const schedule_1 = require("@nestjs/schedule");
const cronjob_module_1 = require("./cronjob/cronjob.module");
const mailer_1 = require("@nestjs-modules/mailer");
const auth_module_1 = require("./auth/auth.module");
const upload_module_1 = require("./upload/upload.module");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
const notifications_module_1 = require("./notifications/notifications.module");
const event_emitter_1 = require("@nestjs/event-emitter");
const mail_module_1 = require("./mail/mail.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            prisma_module_1.PrismaModule,
            danh_muc_module_1.DanhMucModule,
            cong_ty_module_1.CongTyModule,
            ho_so_module_1.HoSoModule,
            upload_module_1.UploadModule,
            notifications_module_1.NotificationsModule,
            event_emitter_1.EventEmitterModule.forRoot(),
            mail_module_1.MailModule,
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', '..', 'uploads'),
                serveRoot: '/api/uploads',
            }),
            schedule_1.ScheduleModule.forRoot(),
            cronjob_module_1.CronjobModule,
            mailer_1.MailerModule.forRoot({
                transport: {
                    host: process.env.MAIL_HOST || 'smtp.gmail.com',
                    port: Number(process.env.MAIL_PORT) || 587,
                    secure: process.env.MAIL_SECURE === 'true',
                    auth: {
                        user: process.env.MAIL_USER || 'test@example.com',
                        pass: process.env.MAIL_PASS || 'password',
                    },
                },
                defaults: {
                    from: process.env.MAIL_FROM || '"Hệ thống SCB" <noreply@scb.com>',
                },
            }),
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map