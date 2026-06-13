import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type AuthUser, UpdateFxRateRequest } from '@cost-reaper/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
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

  @Patch(':currency')
  @Roles('ADMIN')
  upsert(
    @Param('currency') currency: string,
    @Body(new ZodValidationPipe(UpdateFxRateRequest)) dto: UpdateFxRateRequest,
    @CurrentUser() u: AuthUser,
  ) {
    return this.fx.upsert(currency, dto, u);
  }
}
