import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map(data => {
        let message = 'Thành công';
        let resultData = data;
        
        if (data && typeof data === 'object' && 'data' in data && 'message' in data && Object.keys(data).length <= 3) {
            message = data.message;
            resultData = data.data;
        } else if (data && typeof data === 'object' && 'message' in data && !('data' in data) && Object.keys(data).length <= 2) {
            message = data.message;
            resultData = null;
        }

        return {
          success: true,
          message: message,
          data: resultData === undefined ? null : resultData,
        };
      }),
    );
  }
}
