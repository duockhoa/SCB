import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LogsService {
  constructor(private prisma: PrismaService) {}

  async getLogs(page = 1, limit = 20) {
    const skip = (Number(page) - 1) * Number(limit);

    const [total, data] = await Promise.all([
      this.prisma.nhat_ky_he_thong.count(),
      this.prisma.nhat_ky_he_thong.findMany({
        skip,
        take: Number(limit),
        orderBy: { created_at: 'desc' },
        include: {
          nguoi_dung: {
            select: { id: true, ho_ten: true, ma_nguoi_dung: true }
          }
        }
      })
    ]);

    return {
      total,
      page: Number(page),
      limit: Number(limit),
      data
    };
  }
}
