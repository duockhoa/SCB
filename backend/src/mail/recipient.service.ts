import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecipientService {
  private readonly logger = new Logger(RecipientService.name);

  constructor(private prisma: PrismaService) {}

  async getRecipientsForEvent(eventName: string, context: any): Promise<string[]> {
    try {
      // 1. Kiểm tra xem sự kiện này có đang được BẬT gửi mail không
      const eventToggle = await this.prisma.cau_hinh_gui_mail.findFirst({
        where: { 
          ma_su_kien: 'EVENT_TOGGLE', 
          loai_dieu_kien: eventName,
          trang_thai: true 
        },
      });

      if (!eventToggle) {
        return []; // Sự kiện này không được cấu hình gửi mail
      }

      // 2. Lấy danh sách toàn bộ email nhận thông báo chung
      const configs = await this.prisma.cau_hinh_gui_mail.findMany({
        where: { ma_su_kien: 'GLOBAL_EMAIL', trang_thai: true },
      });

      if (configs.length === 0) {
        return [];
      }

      const emails = new Set<string>();

      for (const config of configs) {
        if (config.gia_tri) {
          emails.add(config.gia_tri);
        }
      }

      return Array.from(emails);
    } catch (error) {
      this.logger.error(`Error resolving recipients: ${error.message}`);
      return [];
    }
  }
}
