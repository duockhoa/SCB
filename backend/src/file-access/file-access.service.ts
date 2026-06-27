import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class FileAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsGateway: NotificationsGateway
  ) {}

  async requestAccess(userId: number, taiLieuId: number | null, fileName: string | null, lyDo: string) {
    if (!taiLieuId && !fileName) {
      throw new BadRequestException('Phải cung cấp taiLieuId hoặc fileName');
    }

    const whereClause: any = { nguoi_yeu_cau_id: userId, trang_thai: { in: ['PENDING', 'APPROVED'] } };
    if (taiLieuId) whereClause.tai_lieu_id = taiLieuId;
    if (fileName) whereClause.file_name = fileName;

    const existing = await this.prisma.yeu_cau_truy_cap_file.findFirst({
       where: whereClause
    });
    
    if (existing) {
       if (existing.trang_thai === 'APPROVED' && existing.ngay_het_han && existing.ngay_het_han > new Date()) {
          throw new BadRequestException('Bạn đã có quyền truy cập file này');
       }
       if (existing.trang_thai === 'PENDING') {
          throw new BadRequestException('Yêu cầu của bạn đang chờ duyệt');
       }
    }

    const request = await this.prisma.yeu_cau_truy_cap_file.create({
      data: {
        nguoi_yeu_cau_id: userId,
        tai_lieu_id: taiLieuId,
        file_name: fileName,
        ly_do: lyDo,
        trang_thai: 'PENDING'
      }
    });

    this.notificationsGateway.server.emit('profileUpdated', { 
       title: 'Yêu cầu truy cập file mới',
       message: 'Có người vừa xin quyền truy cập tài liệu. Vui lòng kiểm tra.'
    });

    return request;
  }

  async getRequests() {
    return this.prisma.yeu_cau_truy_cap_file.findMany({
      include: {
        nguoi_yeu_cau: { select: { ho_ten: true, phong_ban: true } },
        tai_lieu: { select: { ten_tai_lieu: true, duong_dan_url: true, ho_so_chung: { select: { ten_san_pham: true } } } }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async approveRequest(id: number, approverId: number, hours: number) {
    const request = await this.prisma.yeu_cau_truy_cap_file.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Không tìm thấy yêu cầu');

    const expireDate = new Date();
    expireDate.setHours(expireDate.getHours() + hours);

    const updated = await this.prisma.yeu_cau_truy_cap_file.update({
      where: { id },
      data: {
        trang_thai: 'APPROVED',
        ngay_het_han: expireDate,
        nguoi_duyet_id: approverId
      }
    });
    
    this.notificationsGateway.server.emit('profileUpdated', { 
       title: 'Yêu cầu truy cập đã được duyệt',
       message: 'Yêu cầu xem tài liệu của bạn đã được duyệt.'
    });

    return updated;
  }

  async rejectRequest(id: number, approverId: number) {
    const updated = await this.prisma.yeu_cau_truy_cap_file.update({
      where: { id },
      data: {
        trang_thai: 'REJECTED',
        nguoi_duyet_id: approverId
      }
    });
    return updated;
  }
}
