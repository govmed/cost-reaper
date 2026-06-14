import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { AuthService } from '../auth.service';
import { resolveSsoConfig } from './sso-config';
import { createSsoProvider } from './sso-providers';

/** Orchestrates the configured SSO provider (FR-26). Disabled unless configured. */
@Injectable()
export class SsoService {
  private readonly logger = new Logger(SsoService.name);
  private readonly config = resolveSsoConfig();
  private readonly provider = createSsoProvider(this.config);

  constructor(private readonly auth: AuthService) {
    if (this.config.enabled) {
      this.logger.log(`SSO enabled: ${this.config.protocol} (${this.config.displayName})`);
    } else if (this.config.reason) {
      this.logger.warn(`SSO disabled: ${this.config.reason}`);
    }
  }

  /** Public status — what the sign-in screen needs to render the SSO button. */
  status(): { enabled: boolean; protocol: string | null; displayName: string | null } {
    return {
      enabled: this.config.enabled,
      protocol: this.config.enabled ? this.config.protocol : null,
      displayName: this.config.enabled ? this.config.displayName : null,
    };
  }

  async loginUrl(): Promise<string> {
    if (!this.provider) throw new BadRequestException('SSO is not configured');
    const state = randomBytes(16).toString('hex');
    return this.provider.getLoginUrl(state);
  }

  async complete(params: Record<string, string | undefined>) {
    if (!this.provider) throw new BadRequestException('SSO is not configured');
    const identity = await this.provider.handleCallback(params);
    return this.auth.ssoLogin(identity);
  }
}
