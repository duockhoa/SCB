import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(private prisma: PrismaService) {}

  async syncUsersFromHRM(authHeader: string) {
    if (!authHeader) {
      throw new HttpException('Missing authorization header', HttpStatus.UNAUTHORIZED);
    }

    const hrmUrl = process.env.NEXT_PUBLIC_AUTH_URL || 'https://server.dkpharma.io.vn';
    this.logger.log(`Fetching users from HRM API: ${hrmUrl}/users`);

    try {
      const response = await fetch(`${hrmUrl}/users`, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new HttpException(`Failed to fetch users: ${response.statusText}`, response.status);
      }

      const responseData = await response.json();
      const users = Array.isArray(responseData) ? responseData : (responseData.data || responseData.users || []);
      
      this.logger.log(`Fetched ${users.length} users from HRM. Syncing to DB...`);

      let synced = 0;
      for (const user of users) {
        const ma_nguoi_dung = user.username || user.id?.toString();
        if (!ma_nguoi_dung) continue;

        const existing = await this.prisma.nguoi_dung.findUnique({
          where: { ma_nguoi_dung },
          select: { id: true, vai_tro_id: true }
        });

        let defaultRoleId: number | null = null;
        if (!existing || !existing.vai_tro_id) {
          const dept = (user.department || '').toLowerCase();
          const pos = (user.position || '').toLowerCase();
          let targetRoleCode = 'VIEWER';
          if (dept.includes('đăng ký')) {
            targetRoleCode = (pos.includes('tp') || pos.includes('trưởng phòng')) ? 'TRUONG_PHONG' : 'NV_DANG_KY';
          }
          const role = await this.prisma.vai_tro.findUnique({ where: { ma_vai_tro: targetRoleCode } });
          if (role) defaultRoleId = role.id;
        }

        await this.prisma.nguoi_dung.upsert({
          where: { ma_nguoi_dung },
          update: {
            ho_ten: user.fullName || user.ho_ten || user.name || 'Unknown',
            email: user.email || null,
            phong_ban: user.department || null,
            chuc_vu: user.position || null,
            ...(existing?.vai_tro_id ? {} : (defaultRoleId ? { vai_tro_id: defaultRoleId } : {}))
          },
          create: {
            ma_nguoi_dung,
            ho_ten: user.fullName || user.ho_ten || user.name || 'Unknown',
            email: user.email || null,
            phong_ban: user.department || null,
            chuc_vu: user.position || null,
            vai_tro_id: defaultRoleId
          }
        });
        synced++;
      }

      this.logger.log(`Successfully synced ${synced} users.`);
      return { data: { totalSynced: synced }, message: 'Sync successful' };
    } catch (error: any) {
      this.logger.error('Error syncing users', error);
      throw new HttpException(error.message || 'Error syncing users from HRM', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
