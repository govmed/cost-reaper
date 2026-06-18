import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Emits one structured JSON log line per request, with correlation id (NFR-9).
 * Logs BOTH successful responses AND failures — including guard denials
 * (401/403) and handler errors (4xx/5xx), which previously bypassed the
 * success-only `tap` — so the request log is a complete audit/observability trail.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { id?: string }>();
    const res = http.getResponse<Response>();
    const start = Date.now();

    const emit = (status: number, error?: string): void => {
      const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
      const line = {
        level,
        time: new Date().toISOString(),
        requestId: req.id,
        method: req.method,
        url: req.url,
        status,
        ms: Date.now() - start,
        ...(error ? { error } : {}),
      };
      process.stdout.write(`${JSON.stringify(line)}\n`);
    };

    return next.handle().pipe(
      tap({
        next: () => emit(res.statusCode),
        error: (err: unknown) => {
          const status = err instanceof HttpException ? err.getStatus() : 500;
          const message = err instanceof Error ? err.message : 'error';
          emit(status, message);
        },
      }),
    );
  }
}
