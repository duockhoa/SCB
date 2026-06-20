import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailerService } from '@nestjs-modules/mailer';
import { RecipientService } from './recipient.service';
import { PrismaService } from '../prisma/prisma.service';
import { decryptString } from '../common/utils/crypto.util';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private mailerService: MailerService,
    private recipientService: RecipientService,
    private prisma: PrismaService
  ) {}

  @OnEvent('hoSo.*', { async: true })
  async handleHoSoEvents(data: any) {
    try {
      // Xác định event name thực tế, mặc định nếu không truyền thì hiểu là hoSo.updated
      const eventName = data.eventName || 'HO_SO_UPDATED';
      this.logger.log(`Received event ${eventName} for Ho So ${data.ma_ho_so}`);

      // Lấy danh sách email
      const emails = await this.recipientService.getRecipientsForEvent(eventName, data);

      if (!emails || emails.length === 0) {
        this.logger.log(`No recipients found for event ${eventName}. Skipping email.`);
        return;
      }

      // Xây dựng tiêu đề và nội dung
      let subject = `[Hệ thống SCB] Thông báo: ${eventName}`;
      let content = `Hồ sơ ${data.ma_ho_so} - ${data.ten_san_pham} vừa có cập nhật mới.\n`;

      if (eventName === 'HO_SO_CREATED') {
        subject = `[Hệ thống SCB] Hồ sơ mới được tạo: ${data.ma_ho_so}`;
        content = `Hồ sơ mới: ${data.ma_ho_so} - ${data.ten_san_pham} vừa được tạo trên hệ thống.\n`;
      } else if (eventName === 'HO_SO_UPDATED') {
        subject = `[Hệ thống SCB] Cập nhật Hồ Sơ: ${data.ma_ho_so}`;
        content = `Hồ sơ ${data.ma_ho_so} - ${data.ten_san_pham} vừa được cập nhật.\n`;
      } else if (eventName === 'HO_SO_SAP_HET_HAN') {
        subject = `[Hệ thống SCB] Cảnh báo: Hồ sơ sắp hết hạn (${data.ma_ho_so})`;
        content = `Hồ sơ ${data.ma_ho_so} - ${data.ten_san_pham} sắp hết hạn.\n`;
      } else if (eventName === 'HO_SO_THAY_THE') {
        subject = `[Hệ thống SCB] Hồ sơ đã được thay thế: ${data.ma_ho_so}`;
      } else if (eventName === 'HO_SO_GIA_HAN') {
        subject = `[Hệ thống SCB] Hồ sơ được gia hạn: ${data.ma_ho_so}`;
      }
      
      // Backward compatibility with old action
      if (data.action === 'THAY_DOI') {
        subject = `[Hệ thống SCB] Thay đổi thông tin: ${data.ma_ho_so}`;
        content = `Hồ sơ ${data.ma_ho_so} vừa có cập nhật: ${data.noi_dung || 'N/A'}.\n`;
      } else if (data.action === 'UPDATE_LICH_SU') {
        subject = `[Hệ thống SCB] Cập nhật tình trạng thay đổi: ${data.ma_ho_so}`;
        content = `Lịch sử thay đổi của hồ sơ ${data.ma_ho_so} vừa được cập nhật.\n`;
      }

      const timeStr = new Date(data.time || new Date()).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      content += `\nThời gian: ${timeStr}`;
      content += `\n\nVui lòng đăng nhập hệ thống để xem chi tiết.`;

      // Thử đọc cấu hình SMTP từ DB
      let useDbSmtp = false;
      const smtpConfig = await this.prisma.cau_hinh_smtp.findFirst({ where: { is_active: true } });
      
      if (smtpConfig && smtpConfig.pass) {
        try {
          const decryptedPass = decryptString(smtpConfig.pass);
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
        } catch (dbSmtpError) {
          this.logger.error(`DB SMTP Config failed, falling back to ENV config: ${dbSmtpError.message}`);
        }
      }

      // Fallback về .env cấu hình nếu DB không có hoặc bị lỗi
      if (!useDbSmtp) {
        await this.mailerService.sendMail({
          to: emails,
          subject: subject,
          text: content,
        });
        this.logger.log(`Email sent successfully via ENV SMTP to ${emails.length} recipients.`);
      }

    } catch (error) {
      this.logger.error(`Failed to send email for event: ${error.message}`);
    }
  }
}

