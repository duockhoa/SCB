import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecipientService {
  private readonly logger = new Logger(RecipientService.name);

  constructor(private prisma: PrismaService) {}

  async getRecipientsForEvent(eventName: string, context: any): Promise<string[]> {
    try {
      const configs = await this.prisma.cau_hinh_gui_mail.findMany({
        where: { ma_su_kien: eventName, trang_thai: true },
      });

      if (configs.length === 0) {
        return [];
      }

      const emails = new Set<string>();

      for (const config of configs) {
        switch (config.loai_dieu_kien) {
          case 'EMAIL_CU_THE':
            if (config.gia_tri) emails.add(config.gia_tri);
            break;

          case 'NGUOI_PHU_TRACH':
            if (context?.ownerId) {
              const user = await this.prisma.nguoi_dung.findUnique({
                where: { id: context.ownerId },
              });
              if (user?.email) emails.add(user.email);
            }
            break;

          case 'ROLE':
            if (config.gia_tri) {
              const users = await this.prisma.nguoi_dung.findMany({
                where: {
                  vai_tro: { ma_vai_tro: config.gia_tri },
                  trang_thai: true,
                },
              });
              users.forEach(u => emails.add(u.email));
            }
            break;

          case 'PHONG_BAN':
            if (config.gia_tri) {
              const users = await this.prisma.nguoi_dung.findMany({
                where: {
                  phong_ban: config.gia_tri,
                  trang_thai: true,
                },
              });
              users.forEach(u => emails.add(u.email));
            }
            break;

          default:
            this.logger.warn(`Unknown condition type: ${config.loai_dieu_kien}`);
            break;
        }
      }

      return Array.from(emails);
    } catch (error) {
      this.logger.error(`Error resolving recipients: ${error.message}`);
      return [];
    }
  }
}
