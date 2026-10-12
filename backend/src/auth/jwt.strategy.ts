import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { expandPermissions } from '../users/rbac.constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: any) => {
          return request?.query?.token as string;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'DO_NOT_USE_IN_PRODUCTION_JWT_SECRET_KEY_12345',
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any) {
    const ma_nguoi_dung = payload.username || payload.sub?.toString() || payload.id?.toString();
    const ho_ten = payload.name || 'Unknown';
    const email = payload.email || null;
    let phong_ban = payload.department || null;
    let chuc_vu = payload.position || null;

    if (!ma_nguoi_dung) {
      return payload; // Fallback
    }

    let user = await this.prisma.nguoi_dung.findUnique({
      where: { ma_nguoi_dung },
      include: { vai_tro: true }
    });

    // Nếu user chưa tồn tại hoặc thiếu phong_ban/chuc_vu trong DB, thử lấy trực tiếp từ HRM để đồng bộ
    if (!user || user.phong_ban === null || user.chuc_vu === null) {
      try {
        let token = req.headers.authorization;
        if (!token && req.query?.token) {
          token = `Bearer ${req.query.token}`;
        }
        if (token) {
          const hrmUrl = process.env.NEXT_PUBLIC_AUTH_URL || 'https://server.dkpharma.io.vn';
          const res = await fetch(`${hrmUrl}/users/me`, {
            headers: {
              'Authorization': token,
              'Content-Type': 'application/json'
            }
          });
          if (res.ok) {
            const hrmUser = await res.json();
            if (hrmUser) {
              phong_ban = hrmUser.department || phong_ban;
              chuc_vu = hrmUser.position || chuc_vu;
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch user profile from HRM during validation:', error);
      }
    }

    if (!user) {
      user = await this.prisma.nguoi_dung.create({
        data: {
          ma_nguoi_dung,
          ho_ten,
          email,
          phong_ban,
          chuc_vu,
        },
        include: { vai_tro: true }
      });
    } else if ((phong_ban && user.phong_ban !== phong_ban) || (chuc_vu && user.chuc_vu !== chuc_vu)) {
      // Cập nhật thông tin mới nhất từ HRM vào DB nếu phát hiện thay đổi
      user = await this.prisma.nguoi_dung.update({
        where: { id: user.id },
        data: {
          phong_ban: phong_ban || user.phong_ban,
          chuc_vu: chuc_vu || user.chuc_vu,
        },
        include: { vai_tro: true }
      });
    }

    const DEVELOPER_USERNAMES = (process.env.DEVELOPER_USERNAMES || 'lehoangcuong').split(',').map(s => s.trim().toLowerCase());
    const isDeveloper = DEVELOPER_USERNAMES.includes(ma_nguoi_dung?.toLowerCase());
    const isAdmin = isDeveloper || user.vai_tro?.ma_vai_tro === 'ADMIN';

    // Nếu người dùng chưa có vai trò RBAC trong DB, tự động gán vai trò khởi tạo để có thể quản lý trực tiếp trên app
    if (!user.vai_tro_id) {
      let defaultRoleCode = 'VIEWER';
      const deptNormalized = (user.phong_ban || phong_ban || '').toLowerCase();
      const posNormalized = (user.chuc_vu || chuc_vu || '').toLowerCase();

      if (isAdmin) {
        defaultRoleCode = 'ADMIN';
      } else if (deptNormalized.includes('đăng ký')) {
        if (posNormalized.includes('tp') || posNormalized.includes('trưởng phòng')) {
          defaultRoleCode = 'TRUONG_PHONG';
        } else {
          defaultRoleCode = 'NV_DANG_KY';
        }
      }

      const defaultRole = await this.prisma.vai_tro.findUnique({
        where: { ma_vai_tro: defaultRoleCode }
      });

      if (defaultRole) {
        user = await this.prisma.nguoi_dung.update({
          where: { id: user.id },
          data: { vai_tro_id: defaultRole.id },
          include: { vai_tro: true }
        });
      }
    }

    let rolePermissions: string[] = [];
    if (user.vai_tro?.quyen_han) {
      try {
        rolePermissions = JSON.parse(user.vai_tro.quyen_han);
      } catch {
        rolePermissions = [];
      }
    }

    let customPermissions: string[] = [];
    if (user.quyen_rieng) {
      try {
        customPermissions = JSON.parse(user.quyen_rieng);
      } catch {
        customPermissions = [];
      }
    }

    const expandedRolePerms = expandPermissions(rolePermissions);
    const expandedCustomPerms = expandPermissions(customPermissions);
    const effectivePermissions = Array.from(new Set([...expandedRolePerms, ...expandedCustomPerms]));

    return {
      ...payload,
      userId: user.id, // ID cục bộ trong SCB
      hrmId: payload.id || payload.sub,
      username: ma_nguoi_dung,
      name: user.ho_ten || ho_ten,
      department: user.phong_ban || phong_ban,
      position: user.chuc_vu || chuc_vu,
      role: user.vai_tro?.ma_vai_tro || null,
      roleName: user.vai_tro?.ten_vai_tro || null,
      permissions: isAdmin ? ['*'] : effectivePermissions,
      rolePermissions: expandedRolePerms,
      customPermissions: expandedCustomPerms,
      isAdmin,
    };
  }
}
