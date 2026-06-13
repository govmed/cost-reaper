import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

/**
 * Simple in-memory per-IP throttle for credential endpoints (FE-31, OWASP
 * brute-force mitigation). Dep-free; a distributed deployment would back this
 * with a shared store. Generous enough not to affect normal use.
 */
@Injectable()
export class LoginThrottleGuard implements CanActivate {
  private readonly hits = new Map<string, number[]>();
  private readonly windowMs = 60_000;
  private readonly limit = 30;

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    const recent = (this.hits.get(ip) ?? []).filter((t) => now - t < this.windowMs);
    if (recent.length >= this.limit) {
      throw new HttpException(
        'Too many authentication attempts — please slow down.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    recent.push(now);
    this.hits.set(ip, recent);
    return true;
  }
}
