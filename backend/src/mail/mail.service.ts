import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailerService } from '@nestjs-modules/mailer';
import { RecipientService } from './recipient.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private mailerService: MailerService,
    private recipientService: RecipientService
  ) {}

  @OnEvent('hoSo.updated', { async: true })
  async handleHoSoUpdatedEvent(data: any) {
    try {
      this.logger.log(`Received hoSo.updated event for Ho So ${data.ma_ho_so}`);

      // Lấy danh sách email
      const emails = await this.recipientService.getRecipientsForEvent('hoSo.updated', data);

      if (!emails || emails.length === 0) {
        this.logger.log(`No recipients found for event hoSo.updated. Skipping email.`);
        return;
      }

      // Xây dựng tiêu đề và nội dung
      let subject = '[Hệ thống SCB] Cập nhật Hồ Sơ';
      let content = `Hồ sơ ${data.ma_ho_so} - ${data.ten_san_pham} vừa được cập nhật.\n`;

      if (data.action === 'THAY_DOI') {
        subject = `[Hệ thống SCB] Thay đổi thông tin: ${data.ma_ho_so}`;
        content = `Hồ sơ ${data.ma_ho_so} vừa có cập nhật: ${data.noi_dung || 'N/A'}.\n`;
      } else if (data.action === 'UPDATE_LICH_SU') {
        subject = `[Hệ thống SCB] Cập nhật tình trạng thay đổi: ${data.ma_ho_so}`;
        content = `Lịch sử thay đổi của hồ sơ ${data.ma_ho_so} vừa được cập nhật.\n`;
      }

      const timeStr = new Date(data.time).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      content += `\nThời gian: ${timeStr}`;
      content += `\n\nVui lòng đăng nhập hệ thống để xem chi tiết.`;

      // Gửi mail (Không throw error ra ngoài)
      await this.mailerService.sendMail({
        to: emails,
        subject: subject,
        text: content,
        // template: 'profile-updated', // Bỏ comment nếu dùng template engine pug
      });

      this.logger.log(`Email sent successfully to ${emails.length} recipients.`);
    } catch (error) {
      this.logger.error(`Failed to send email for hoSo.updated: ${error.message}`);
    }
  }
}
