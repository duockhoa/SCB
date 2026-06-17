import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Hỗ trợ 2 cách nhận token: qua Header Authorization (Bearer) hoặc qua Header tùy chỉnh nếu cần
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // ĐÂY LÀ ĐIỂM QUAN TRỌNG: Cần lấy SECRET_KEY giống hệt với HRM đang dùng
      secretOrKey: process.env.JWT_SECRET || 'DO_NOT_USE_IN_PRODUCTION_JWT_SECRET_KEY_12345',
    });
  }

  async validate(payload: any) {
    // Trả về toàn bộ payload để RolesGuard có thể lấy được các thông tin như name, department, position (nếu HRM có nhúng vào token)
    return {
      userId: payload.sub || payload.id,
      ...payload
    };
  }
}
