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
      this.logger.log(`Identity: ${this.config.protocol} SSO (${this.config.displayName})`);
    } else {
      this.logger.log(
        `Identity: LOCAL (built-in)${this.config.reason ? ` — ${this.config.reason}` : ''}`,
      );
    }
  }

  /** Public status — what the sign-in screen needs to choose its identity UI. */
  status(): {
    mode: string;
    enabled: boolean;
    protocol: string | null;
    displayName: string | null;
    forceSso: boolean;
  } {
    return {
      mode: this.config.mode,
      enabled: this.config.enabled,
      protocol: this.config.enabled ? this.config.protocol : null,
      displayName: this.config.enabled ? this.config.displayName : null,
      forceSso: this.config.enabled ? this.config.forceSso : false,
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
