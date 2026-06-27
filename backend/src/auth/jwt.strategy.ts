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
    });
  }

  async validate(payload: any) {
    const ma_nguoi_dung = payload.username || payload.sub?.toString() || payload.id?.toString();
    const ho_ten = payload.name || 'Unknown';
    const email = payload.email || null;
    const phong_ban = payload.department || null;
    const chuc_vu = payload.position || null;

    if (!ma_nguoi_dung) {
      return payload; // Fallback
    }

    let user = await this.prisma.nguoi_dung.findUnique({
      where: { ma_nguoi_dung }
    });

    if (!user) {
      user = await this.prisma.nguoi_dung.create({
        data: {
          ma_nguoi_dung,
          ho_ten,
          email,
          phong_ban,
          chuc_vu,
        }
      });
    }

    return {
      userId: user.id, // ID cục bộ trong SCB
      hrmId: payload.id || payload.sub,
      username: ma_nguoi_dung,
      name: ho_ten,
      department: phong_ban,
      position: chuc_vu,
      ...payload
    };
  }
}
