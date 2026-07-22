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
      const eventName = data.eventName || 'HO_SO_UPDATED';
      this.logger.log(`Received event ${eventName} for Ho So ${data.ma_ho_so}`);

      const emails = await this.recipientService.getRecipientsForEvent(eventName, data);

      if (!emails || emails.length === 0) {
        this.logger.log(`No recipients found for event ${eventName}. Skipping email.`);
        return;
      }

      // Xây dựng đường dẫn truy cập trực tiếp tới hồ sơ trên Frontend
      const frontendUrl = (process.env.FRONTEND_URL || 'http://test.dkpharma.io.vn:3006').replace(/\/$/, '');
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

      // Nội dung HTML định dạng đẹp
      const htmlContent = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
  <div style="background-color: #004680; color: #ffffff; padding: 20px 24px; text-align: center;">
    <div style="margin-bottom: 8px;">
      <img src="${frontendUrl}/dkpharmalogo.png" alt="DKPharma" style="max-height: 45px; background-color: #ffffff; padding: 4px 12px; border-radius: 6px; display: inline-block;" />
    </div>
    <div style="font-size: 18px; font-weight: bold; letter-spacing: 0.5px;">HỆ THỐNG QUẢN LÝ HỒ SƠ SCB</div>
  </div>
  <div style="padding: 24px; color: #2d3748; line-height: 1.6;">
    <div style="display: inline-block; background-color: #ebf8ff; color: #2b6cb0; font-size: 13px; font-weight: bold; padding: 4px 10px; border-radius: 4px; margin-bottom: 12px;">
      ${actionTitle.toUpperCase()}
    </div>
    <p style="font-size: 15px; margin-top: 4px; margin-bottom: 20px;">
      ${eventDescription}
    </p>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; background-color: #f7fafc; border-radius: 6px; border: 1px solid #edf2f7; font-size: 14px;">
      <tr>
        <td style="padding: 10px 14px; font-weight: bold; border-bottom: 1px solid #edf2f7; width: 140px; color: #4a5568;">Mã hồ sơ:</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #edf2f7; color: #1a202c;"><strong>${data.ma_ho_so || 'N/A'}</strong></td>
      </tr>
      <tr>
        <td style="padding: 10px 14px; font-weight: bold; border-bottom: 1px solid #edf2f7; color: #4a5568;">Tên sản phẩm:</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #edf2f7; color: #1a202c;">${data.ten_san_pham || 'N/A'}</td>
      </tr>
      ${data.so_chinh ? `
      <tr>
        <td style="padding: 10px 14px; font-weight: bold; border-bottom: 1px solid #edf2f7; color: #4a5568;">Số công bố/đăng ký:</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #edf2f7; color: #1a202c;"><strong>${data.so_chinh}</strong></td>
      </tr>` : ''}
      ${data.noi_dung ? `
      <tr>
        <td style="padding: 10px 14px; font-weight: bold; border-bottom: 1px solid #edf2f7; color: #4a5568;">Chi tiết nội dung:</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #edf2f7; color: #1a202c;">${data.noi_dung}</td>
      </tr>` : ''}
      <tr>
        <td style="padding: 10px 14px; font-weight: bold; color: #4a5568;">Thời gian:</td>
        <td style="padding: 10px 14px; color: #1a202c;">${timeStr}</td>
      </tr>
    </table>

    <div style="text-align: center; margin: 28px 0 20px 0;">
      <a href="${accessUrl}" target="_blank" style="background-color: #004680; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        Xem Chi Tiết Hồ Sơ
      </a>
    </div>

    <div style="font-size: 12px; color: #718096; background-color: #f7fafc; padding: 10px 12px; border-radius: 4px; border-left: 3px solid #cbd5e0; word-break: break-all;">
      Nếu nút bấm không hoạt động, bạn có thể truy cập trực tiếp đường dẫn sau:<br>
      <a href="${accessUrl}" target="_blank" style="color: #004680; text-decoration: underline;">${accessUrl}</a>
    </div>
  </div>
  <div style="background-color: #edf2f7; color: #718096; padding: 12px 24px; font-size: 12px; text-align: center; border-top: 1px solid #e2e8f0;">
    Thông báo tự động từ Hệ thống Quản lý Hồ sơ Đăng ký SCB - DKPharma
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
