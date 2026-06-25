import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const { method, url, body, ip, user } = request;

    // Chỉ log các thao tác làm thay đổi dữ liệu
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle().pipe(
        tap(async () => {
          const statusCode = response.statusCode;
          const userId = user?.userId || null; // userId từ JwtStrategy
          
          try {
            await this.prisma.nhat_ky_he_thong.create({
              data: {
                nguoi_dung_id: userId,
                phuong_thuc: method,
                duong_dan: url,
                chi_tiet: JSON.stringify(body),
                ip_address: ip,
                status_code: statusCode,
              },
            });
            this.logger.log(`[Log] User ${userId || 'Unknown'} - ${method} ${url} - Status: ${statusCode}`);
          } catch (error) {
            this.logger.error(`Failed to save log for ${method} ${url}`, error);
          }
        }),
      );
    }

    return next.handle();
  }
}
