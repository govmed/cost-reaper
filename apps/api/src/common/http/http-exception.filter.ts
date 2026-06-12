import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { toProblemDetails } from './problem-details';

/** Translates any thrown error into an RFC 7807 problem+json response (NFR-9). */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let title = 'Internal Server Error';
    let detail: string | undefined;
    let errors: unknown;

    if (exception instanceof HttpException) {
      const resp = exception.getResponse();
      if (typeof resp === 'string') {
        title = resp;
      } else if (resp && typeof resp === 'object') {
        const r = resp as Record<string, unknown>;
        title = (r.error as string) ?? exception.message ?? title;
        detail = Array.isArray(r.message)
          ? (r.message as string[]).join('; ')
          : (r.message as string | undefined);
        errors = r.errors;
      }
    } else if (exception instanceof Error) {
      detail = process.env.NODE_ENV === 'production' ? undefined : exception.message;
    }

    if (status >= 500) {
      this.logger.error(
        `${req.method} ${req.url} -> ${status}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    res
      .status(status)
      .type('application/problem+json')
      .json(toProblemDetails({ status, title, detail, instance: req.url, errors }));
  }
}
