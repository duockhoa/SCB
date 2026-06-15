import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Đã có lỗi xảy ra';
    let errorDetail = exception;

    if (exception instanceof HttpException) {
      const response = exception.getResponse() as any;
      message = typeof response === 'string' ? response : (Array.isArray(response.message) ? response.message.join(', ') : response.message || message);
      errorDetail = response.error || response;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const responseBody = {
      success: false,
      message,
      error: process.env.NODE_ENV === 'production' ? null : errorDetail,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
