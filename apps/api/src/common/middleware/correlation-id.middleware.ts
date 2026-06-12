import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

/** Attaches a correlation id to every request/response (NFR-9). */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = req.headers['x-request-id'];
    const id = (Array.isArray(incoming) ? incoming[0] : incoming) || randomUUID();
    (req as Request & { id?: string }).id = id;
    res.setHeader('x-request-id', id);
    next();
  }
}
