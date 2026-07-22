import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailerService } from '@nestjs-modules/mailer';
import { RecipientService } from './recipient.service';
import { PrismaService } from '../prisma/prisma.service';
import { decryptString } from '../common/utils/crypto.util';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private mailerService: MailerService,
    private recipientService: RecipientService,
    private prisma: PrismaService
  ) {}

  private getLogoAttachments() {
    const candidates = [
      path.join(__dirname, '../assets/dkpharmalogo.png'),
      path.join(__dirname, '../../src/assets/dkpharmalogo.png'),
      path.join(process.cwd(), 'src/assets/dkpharmalogo.png'),
      path.join(process.cwd(), 'dist/assets/dkpharmalogo.png'),
      path.join(process.cwd(), '../frontend/public/dkpharmalogo.png'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        return [{
          filename: 'dkpharmalogo.png',
          path: p,
          cid: 'dkpharmalogo'
        }];
      }
    }
    return [];
  }

  @OnEvent('hoSo.*', { async: true })
  async handleHoSoEvents(data: any) {
    try {
      const eventName = data.eventName || 'HO_SO_UPDATED';
      this.logger.log(`Received event ${eventName} for Ho So ${data.ma_ho_so}`);

      const emails = await this.recipientService.getRecipientsForEvent(eventName, data);

      if (!emails || emails.length === 0) {
        this.logger.log(`No recipients found for event ${eventName}. Skipping email.`);
        return;
      }

      // Xây dựng đường dẫn truy cập trực tiếp tới hồ sơ trên Frontend
      const frontendUrl = (process.env.FRONTEND_URL || 'https://scb.dkpharma.io.vn').replace(/\/$/, '');
      const accessUrl = data.id ? `${frontendUrl}/ho-so?id=${data.id}` : `${frontendUrl}/ho-so`;

      // Xác định tiêu đề và mô tả sự kiện chi tiết
      let actionTitle = 'Cập nhật thông tin hồ sơ';
      let eventDescription = `Hồ sơ <strong>${data.ma_ho_so || ''}</strong> - <strong>${data.ten_san_pham || ''}</strong> vừa có sự thay đổi thông tin trên hệ thống.`;
      let subject = `[Hệ thống SCB] Cập nhật Hồ sơ: ${data.ma_ho_so || ''} (${data.ten_san_pham || ''})`;

      if (eventName === 'HO_SO_CREATED' || data.action === 'CREATE') {
        actionTitle = 'Tạo mới hồ sơ';
        subject = `[Hệ thống SCB] Tạo mới Hồ sơ: ${data.ma_ho_so} (${data.ten_san_pham})`;
        eventDescription = `Hồ sơ mới <strong>${data.ma_ho_so}</strong> - <strong>${data.ten_san_pham}</strong> vừa được tạo thành công trên hệ thống.`;
      } else if (eventName === 'HO_SO_CAP_SO' || data.action === 'CAP_SO') {
        actionTitle = 'Cấp số công bố / đăng ký';
        subject = `[Hệ thống SCB] Cấp số Hồ sơ: ${data.ma_ho_so} (${data.ten_san_pham})`;
        eventDescription = `Hồ sơ <strong>${data.ma_ho_so}</strong> - <strong>${data.ten_san_pham}</strong> đã được cấp số chính thức: <strong>${data.so_chinh || 'N/A'}</strong>.`;
      } else if (eventName === 'HO_SO_GIA_HAN' || data.action === 'GIA_HAN') {
        actionTitle = 'Gia hạn hồ sơ';
        subject = `[Hệ thống SCB] Gia hạn Hồ sơ: ${data.ma_ho_so} (${data.ten_san_pham})`;
        eventDescription = `Hồ sơ <strong>${data.ma_ho_so}</strong> - <strong>${data.ten_san_pham}</strong> đã được gia hạn thời gian hiệu lực.`;
      } else if (eventName === 'HO_SO_THAY_THE' || data.action === 'THAY_THE') {
        actionTitle = 'Thay thế hồ sơ';
        subject = `[Hệ thống SCB] Thay thế Hồ sơ: ${data.ma_ho_so} (${data.ten_san_pham})`;
        eventDescription = `Hồ sơ <strong>${data.ma_ho_so}</strong> - <strong>${data.ten_san_pham}</strong> đã được tạo phiên bản thay thế.`;
      } else if (eventName === 'HO_SO_THAY_DOI' || data.action === 'THAY_DOI') {
        actionTitle = 'Bổ sung / Thay đổi thông tin hồ sơ';
        subject = `[Hệ thống SCB] Thay đổi Hồ sơ: ${data.ma_ho_so} (${data.ten_san_pham})`;
        eventDescription = `Hồ sơ <strong>${data.ma_ho_so}</strong> - <strong>${data.ten_san_pham}</strong> vừa được ghi nhận bổ sung nội dung thay đổi.`;
      } else if (data.action === 'UPDATE_LICH_SU') {
        actionTitle = 'Cập nhật tiến độ / trạng thái thay đổi';
        subject = `[Hệ thống SCB] Tiến độ thay đổi Hồ sơ: ${data.ma_ho_so} (${data.ten_san_pham})`;
        eventDescription = `Lịch sử thay đổi của hồ sơ <strong>${data.ma_ho_so}</strong> - <strong>${data.ten_san_pham}</strong> vừa được cập nhật trạng thái mới.`;
      } else if (eventName === 'HO_SO_SAP_HET_HAN') {
        actionTitle = 'Cảnh báo hồ sơ sắp hết hạn';
        subject = `[Hệ thống SCB] Cảnh báo: Hồ sơ sắp hết hạn (${data.ma_ho_so})`;
        eventDescription = `Hồ sơ <strong>${data.ma_ho_so}</strong> - <strong>${data.ten_san_pham}</strong> sắp đến hạn hiệu lực. Vui lòng kiểm tra và tiến hành xử lý/gia hạn.`;
      }

      const timeStr = new Date(data.time || new Date()).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

      // Nội dung text thuần (fallback)
      const textContent = `${subject}

Sự kiện: ${actionTitle}
Mã hồ sơ: ${data.ma_ho_so || 'N/A'}
Tên sản phẩm: ${data.ten_san_pham || 'N/A'}
${data.so_chinh ? `Số công bố/đăng ký: ${data.so_chinh}\n` : ''}${data.noi_dung ? `Chi tiết: ${data.noi_dung}\n` : ''}Thời gian: ${timeStr}

Vui lòng truy cập đường dẫn sau để xem chi tiết hồ sơ:
${accessUrl}
`;

      const attachments = this.getLogoAttachments();

      // Mẫu HTML tinh tế (trắng sạch theo phong cách OTP mail DKPharma)
      const htmlContent = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
  <!-- Logo Section -->
  <div style="text-align: center; margin-bottom: 32px;">
    <img src="cid:dkpharmalogo" alt="DKPharma" style="height: 55px; max-width: 220px; display: inline-block;" />
  </div>

  <!-- Content Section -->
  <div style="color: #374151; font-size: 15px; line-height: 1.6; text-align: center;">
    <div style="font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px;">
      ${subject}
    </div>
    <div style="color: #475569; font-size: 14px; margin-bottom: 24px;">
      ${eventDescription}
    </div>

    <!-- Info Box -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: left; margin-bottom: 28px; font-size: 14px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #64748b; width: 140px;">Sự kiện:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #004680;">${actionTitle}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Mã hồ sơ:</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${data.ma_ho_so || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Tên sản phẩm:</td>
          <td style="padding: 6px 0; color: #0f172a;">${data.ten_san_pham || 'N/A'}</td>
        </tr>
        ${data.so_chinh ? `
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Số đăng ký/công bố:</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${data.so_chinh}</td>
        </tr>` : ''}
        ${data.noi_dung ? `
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Chi tiết:</td>
          <td style="padding: 6px 0; color: #0f172a;">${data.noi_dung}</td>
        </tr>` : ''}
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Thời gian:</td>
          <td style="padding: 6px 0; color: #475569;">${timeStr}</td>
        </tr>
      </table>
    </div>

    <!-- Action Button -->
    <div style="margin: 32px 0 24px 0;">
      <a href="${accessUrl}" target="_blank" style="background-color: #004680; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.08);">
        Xem Chi Tiết Hồ Sơ
      </a>
    </div>

    <div style="font-size: 12px; color: #94a3b8; word-break: break-all; margin-top: 16px;">
      Nếu nút bấm không mở được, bạn có thể sao chép liên kết sau:<br>
      <a href="${accessUrl}" target="_blank" style="color: #004680; text-decoration: underline;">${accessUrl}</a>
    </div>
  </div>

  <!-- Footer -->
  <div style="border-top: 1px solid #f1f5f9; margin-top: 40px; padding-top: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
    Đây là email tự động từ Hệ thống SCB - DKPharma. Vui lòng không trả lời email này.
  </div>
</div>
`;

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
            text: textContent,
            html: htmlContent,
            attachments: attachments,
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
          text: textContent,
          html: htmlContent,
        });
        this.logger.log(`Email sent successfully via ENV SMTP to ${emails.length} recipients.`);
      }

    } catch (error) {
      this.logger.error(`Failed to send email for event: ${error.message}`);
    }
  }
}
