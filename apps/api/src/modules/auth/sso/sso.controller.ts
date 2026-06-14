import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../../../common/decorators/public.decorator';
import { SsoService } from './sso.service';

/** SSO endpoints (FR-26) — all public; the protocol is chosen by config. */
@ApiTags('auth')
@Controller('auth/sso')
export class SsoController {
  constructor(private readonly sso: SsoService) {}

  @Public()
  @Get()
  status() {
    return this.sso.status();
  }

  @Public()
  @Get('login')
  async login(@Res() res: Response): Promise<void> {
    res.redirect(await this.sso.loginUrl());
  }

  // OIDC returns via GET (?code=…); SAML/WS-Fed POST the assertion to the ACS.
  @Public()
  @Get('callback')
  async callbackGet(@Query() query: Record<string, string>, @Res() res: Response): Promise<void> {
    await this.finish(query, res);
  }

  @Public()
  @Post('callback')
  async callbackPost(
    @Query() query: Record<string, string>,
    @Body() body: Record<string, string>,
    @Res() res: Response,
  ): Promise<void> {
    await this.finish({ ...query, ...body }, res);
  }

  private async finish(params: Record<string, string>, res: Response): Promise<void> {
    const webBase = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
    try {
      const result = await this.sso.complete(params);
      // Hand the tokens to the SPA via the URL fragment (not sent to servers).
      const frag = new URLSearchParams({
        access: result.accessToken,
        refresh: result.refreshToken,
        user: Buffer.from(JSON.stringify(result.user)).toString('base64url'),
      });
      res.redirect(`${webBase}/sso/callback#${frag.toString()}`);
    } catch (e) {
      res.redirect(`${webBase}/login?sso_error=${encodeURIComponent((e as Error).message)}`);
    }
  }
}
