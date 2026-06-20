import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { encryptString, decryptString } from '../common/utils/crypto.util';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailConfigService {
  private readonly logger = new Logger(EmailConfigService.name);

  constructor(private prisma: PrismaService) {}

  async getSmtpConfig() {
    const config = await this.prisma.cau_hinh_smtp.findFirst();
    if (!config) return null;

    return {
      id: config.id,
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.user,
      from_email: config.from_email,
      is_active: config.is_active,
      pass_configured: !!config.pass, // Indicates if a password is set
    };
  }

  async saveSmtpConfig(data: any) {
    if (!process.env.EMAIL_CONFIG_SECRET_KEY) {
      throw new BadRequestException('EMAIL_CONFIG_SECRET_KEY is not defined in environment variables. Cannot save SMTP configuration securely.');
    }

    const currentConfig = await this.prisma.cau_hinh_smtp.findFirst();

    let passwordToSave = currentConfig?.pass || '';

    // If user provided a new password, encrypt it
    if (data.pass) {
      passwordToSave = encryptString(data.pass);
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
    } else {
      if (!data.pass) {
        throw new BadRequestException('Password is required for the first time setup');
      }
      return this.prisma.cau_hinh_smtp.create({
        data: payload,
      });
    }
  }

  async testSmtpConnection(testEmail: string) {
    const config = await this.prisma.cau_hinh_smtp.findFirst({ where: { is_active: true } });
    if (!config) {
      throw new BadRequestException('No active SMTP configuration found in the database');
    }

    if (!process.env.EMAIL_CONFIG_SECRET_KEY) {
      throw new BadRequestException('EMAIL_CONFIG_SECRET_KEY is not defined');
    }

    let decryptedPass = '';
    try {
      decryptedPass = decryptString(config.pass);
    } catch (e) {
      throw new BadRequestException('Failed to decrypt SMTP password. Secret key might have changed.');
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
    } catch (error) {
      this.logger.error(`Failed to send test email: ${error.message}`);
      throw new BadRequestException(`Gửi mail test thất bại: ${error.message}`);
    }
  }

  // RECIPIENTS CRUD (Simplified)
  async getRecipients() {
    return this.prisma.cau_hinh_gui_mail.findMany({
      where: { ma_su_kien: 'GLOBAL_EMAIL' },
      orderBy: { created_at: 'desc' }
    });
  }

  async addRecipient(data: any) {
    return this.prisma.cau_hinh_gui_mail.create({
      data: {
        ma_su_kien: 'GLOBAL_EMAIL',
        loai_dieu_kien: 'EMAIL_CU_THE',
        gia_tri: data.gia_tri,
        trang_thai: true,
      }
    });
  }

  async updateRecipient(id: number, data: any) {
    // Không dùng update cho simplified mode nữa, nhưng giữ để tránh lỗi API
    return this.prisma.cau_hinh_gui_mail.update({
      where: { id },
      data: { gia_tri: data.gia_tri }
    });
  }

  async deleteRecipient(id: number) {
    return this.prisma.cau_hinh_gui_mail.delete({
      where: { id }
    });
  }

  // EVENT TOGGLES
  async getEvents() {
    const events = await this.prisma.cau_hinh_gui_mail.findMany({
      where: { ma_su_kien: 'EVENT_TOGGLE', trang_thai: true }
    });
    return events.map(e => e.loai_dieu_kien);
  }

  async saveEvents(data: { events: string[] }) {
    // Xóa tất cả các event toggle cũ
    await this.prisma.cau_hinh_gui_mail.deleteMany({
      where: { ma_su_kien: 'EVENT_TOGGLE' }
    });

    // Thêm các event toggle mới
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
}
