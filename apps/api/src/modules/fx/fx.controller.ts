import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type AuthUser, UpdateFxRateRequest } from '@cost-reaper/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { FxService } from './fx.service';

@ApiTags('fx-rates')
@ApiBearerAuth()
@Controller('fx-rates')
export class FxController {
  constructor(private readonly fx: FxService) {}

  @Get()
  list() {
    return this.fx.list();
  }

  @Post('refresh')
  @RequirePermission('fx.manage')
  refresh(@CurrentUser() u: AuthUser) {
    return this.fx.refresh(u);
  }

  @Patch(':currency')
  @RequirePermission('fx.manage')
  upsert(
    @Param('currency') currency: string,
    @Body(new ZodValidationPipe(UpdateFxRateRequest)) dto: UpdateFxRateRequest,
    @CurrentUser() u: AuthUser,
  ) {
    return this.fx.upsert(currency, dto, u);
  }
}
