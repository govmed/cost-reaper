import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/** Emits one structured JSON log line per request, with correlation id (NFR-9). */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { id?: string }>();
    const res = http.getResponse<Response>();
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const line = {
          level: 'info',
          time: new Date().toISOString(),
          requestId: req.id,
          method: req.method,
          url: req.url,
          status: res.statusCode,
          ms: Date.now() - start,
        };
        process.stdout.write(`${JSON.stringify(line)}\n`);
      }),
    );
  }
}
