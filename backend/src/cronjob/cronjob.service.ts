import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CronjobService {
  private readonly logger = new Logger(CronjobService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpirationCheck() {
    this.logger.log('Bắt đầu kiểm tra hồ sơ hết hạn và nhắc hạn...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Tìm các hồ sơ cần nhắc hạn hôm nay
    const hoSosCanNhac = await this.prisma.ho_so_chung.findMany({
      where: {
        ngay_nhac_han: { lte: today },
        tinh_trang: { ma_tinh_trang: 'CON_HIEU_LUC' }
      },
      include: { tinh_trang: true }
    });

    if (hoSosCanNhac.length > 0) {
      const ttSapHetHan = await this.prisma.dm_tinh_trang.findFirst({ where: { ma_tinh_trang: 'SAP_HET_HAN' } });
      if (ttSapHetHan) {
        for (const hs of hoSosCanNhac) {
          await this.prisma.$transaction(async (tx) => {
            // Đổi trạng thái
            await tx.ho_so_chung.update({
              where: { id: hs.id },
              data: { tinh_trang_id: ttSapHetHan.id }
            });
            // Ghi cảnh báo
            await tx.nhac_han_ho_so.create({
              data: {
                ho_so_chung_id: hs.id,
                loai_nhac: 'SAP_HET_HAN',
                ngay_nhac: new Date(),
                noi_dung: `Hồ sơ ${hs.ma_ho_so} (Số công bố: ${hs.so_chinh}) đã đến hạn nhắc nhở.`
              }
            });
            // TODO: Gửi Email qua MailerService (Tích hợp sau nếu có SMTP config)
          });
          this.logger.log(`Đã chuyển trạng thái hồ sơ ${hs.id} sang Sắp hết hạn.`);
        }
      }
    }

    // Tìm các hồ sơ Đã hết hạn
    const hoSosDaHetHan = await this.prisma.ho_so_chung.findMany({
      where: {
        ngay_het_han: { lt: today },
        tinh_trang: { ma_tinh_trang: { in: ['CON_HIEU_LUC', 'SAP_HET_HAN'] } }
      }
    });

    if (hoSosDaHetHan.length > 0) {
      const ttDaHetHan = await this.prisma.dm_tinh_trang.findFirst({ where: { ma_tinh_trang: 'DA_HET_HAN' } });
      if (ttDaHetHan) {
        for (const hs of hoSosDaHetHan) {
          await this.prisma.ho_so_chung.update({
            where: { id: hs.id },
            data: { tinh_trang_id: ttDaHetHan.id }
          });
          this.logger.log(`Đã chuyển trạng thái hồ sơ ${hs.id} sang Đã hết hạn.`);
        }
      }
    }

    this.logger.log('Hoàn thành kiểm tra nhắc hạn hồ sơ.');
  }
}
