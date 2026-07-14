import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

    return {
      userId: user.id, // ID cục bộ trong SCB
      hrmId: payload.id || payload.sub,
      username: ma_nguoi_dung,
      name: user.ho_ten || ho_ten,
      department: user.phong_ban || phong_ban,  // Ưu tiên lấy từ DB
      position: user.chuc_vu || chuc_vu,        // Ưu tiên lấy từ DB
      role: user.vai_tro?.ma_vai_tro || null,    // Vai trò lấy từ DB
      ...payload
    };
  }
}
