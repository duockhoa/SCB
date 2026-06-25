import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { DanhMucModule } from './danh-muc/danh-muc.module';
import { CongTyModule } from './cong-ty/cong-ty.module';
import { HoSoModule } from './ho-so/ho-so.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CronjobModule } from './cronjob/cronjob.module';
import { MailerModule } from '@nestjs-modules/mailer';

import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { NotificationsModule } from './notifications/notifications.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MailModule } from './mail/mail.module';
import { SyncModule } from './sync/sync.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { LogsModule } from './logs/logs.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule, 
    SyncModule,
    LogsModule,
    DanhMucModule, 
    CongTyModule, 
    HoSoModule,
    UploadModule,
    NotificationsModule,
    EventEmitterModule.forRoot(),
    MailModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'uploads'),
      serveRoot: '/api/uploads',
    }),
    ScheduleModule.forRoot(),
    CronjobModule,
    MailerModule.forRoot({
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
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
