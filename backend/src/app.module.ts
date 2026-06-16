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

@Module({
  imports: [
    AuthModule,
    PrismaModule, 
    DanhMucModule, 
    CongTyModule, 
    HoSoModule,
    ScheduleModule.forRoot(),
    CronjobModule,
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST || 'smtp.example.com',
        port: Number(process.env.MAIL_PORT) || 587,
        auth: {
          user: process.env.MAIL_USER || 'test@example.com',
          pass: process.env.MAIL_PASS || 'password',
        },
      },
      defaults: {
        from: '"Hệ thống SCB" <noreply@scb.com>',
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
