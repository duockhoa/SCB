import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { EXPIRY_STATUSES, expiryStatus, reminderDate, todayInVietnam } from '../ho-so/expiry';

@Injectable()
export class CronjobService {
  private readonly logger = new Logger(CronjobService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'Asia/Ho_Chi_Minh' })
  async handleExpirationCheck() {
    const today = todayInVietnam();
    const statuses = await this.prisma.dm_tinh_trang.findMany({
      where: { ma_tinh_trang: { in: EXPIRY_STATUSES } },
    });
    const ids = new Map(statuses.map((status) => [status.ma_tinh_trang, status.id]));
    for (const code of EXPIRY_STATUSES) {
      if (!ids.has(code)) throw new InternalServerErrorException(`Thiếu trạng thái hồ sơ ${code}`);
    }

    let cursor = 0;
    let changed = 0;
    for (;;) {
      const dossiers = await this.prisma.ho_so_chung.findMany({
        where: { id: { gt: cursor }, tinh_trang_id: { in: [...ids.values()] } },
        select: {
          id: true, ma_ho_so: true, ten_san_pham: true, so_chinh: true,
          ngay_het_han: true, ngay_nhac_han: true, tinh_trang_id: true,
        },
        orderBy: { id: 'asc' },
        take: 200,
      });
      if (!dossiers.length) break;
      cursor = dossiers[dossiers.length - 1].id;

      for (const dossier of dossiers) {
        if (!dossier.ngay_het_han) continue;
        const code = expiryStatus(dossier.ngay_het_han, today);
        const nextId = ids.get(code)!;
        const nextReminder = reminderDate(dossier.ngay_het_han);
        if (dossier.tinh_trang_id === nextId &&
          dossier.ngay_nhac_han?.getTime() === nextReminder?.getTime()) continue;

        const transitioned = dossier.tinh_trang_id !== nextId;
        const updated = await this.prisma.$transaction(async (tx) => {
          const result = await tx.ho_so_chung.updateMany({
            where: {
              id: dossier.id,
              tinh_trang_id: dossier.tinh_trang_id,
              ngay_het_han: dossier.ngay_het_han,
            },
            data: { tinh_trang_id: nextId, ngay_nhac_han: nextReminder },
          });
          if (result.count && transitioned && code === 'SAP_HET_HAN') {
            await tx.nhac_han_ho_so.create({
              data: {
                ho_so_chung_id: dossier.id,
                loai_nhac: 'SAP_HET_HAN',
                ngay_nhac: today,
                noi_dung: `Hồ sơ ${dossier.ma_ho_so} sắp hết hạn vào ${dossier.ngay_het_han?.toISOString().slice(0, 10)}.`,
              },
            });
          }
          return result.count;
        });
        if (!updated) continue;
        changed++;
        if (transitioned && code !== 'CON_HIEU_LUC') {
          this.eventEmitter.emit('hoSo.expiryChanged', {
            id: dossier.id,
            ma_ho_so: dossier.ma_ho_so,
            ten_san_pham: dossier.ten_san_pham,
            so_chinh: dossier.so_chinh,
            action: code,
            eventName: code === 'SAP_HET_HAN' ? 'HO_SO_SAP_HET_HAN' : 'HO_SO_DA_HET_HAN',
            time: new Date(),
          });
        }
      }
    }
    this.logger.log(`Đã đối soát hạn hồ sơ ngày ${today.toISOString().slice(0, 10)}: ${changed} hồ sơ cập nhật.`);
  }
}
