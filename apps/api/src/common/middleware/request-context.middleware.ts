import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { runWithRequestContext } from '../request-context';

/** Header carrying the client's coarse location when location services are on. */
const LOCATION_HEADER = 'x-client-location';

function firstHeader(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

/**
 * Captures the caller's IP (proxy-aware) and optional client location into an
 * AsyncLocalStorage context for the lifetime of the request, so the audit trail
 * can stamp who-from-where on every change (FR-11). Location is only present
 * when the client opted in and sent the `x-client-location` header.
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const fwd = firstHeader(req.headers['x-forwarded-for']);
    const ip =
      (fwd ? fwd.split(',')[0].trim() : undefined) ||
      req.ip ||
      req.socket?.remoteAddress ||
      undefined;
    const location = firstHeader(req.headers[LOCATION_HEADER])?.slice(0, 120) || undefined;
    runWithRequestContext({ ip, location }, () => next());
  }
}
