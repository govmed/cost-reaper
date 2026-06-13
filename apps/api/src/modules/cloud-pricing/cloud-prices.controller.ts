import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type AuthUser, CloudPriceQuery, CloudSyncRequest } from '@cost-reaper/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CloudPricesService } from './cloud-prices.service';

// The seeded AWS/GCP/Azure price catalog (FR-21, FE-38). Any authenticated role may read.
@ApiTags('cloud-prices')
@ApiBearerAuth()
@Controller('cloud-prices')
export class CloudPricesController {
  constructor(private readonly prices: CloudPricesService) {}

  @Get()
  list(@Query(new ZodValidationPipe(CloudPriceQuery)) q: CloudPriceQuery) {
    return this.prices.list(q);
  }

  // Per-provider "last pulled" freshness (FR-21b). Static route declared before ':id'.
  @Get('last-pulled')
  lastPulled() {
    return this.prices.lastPulled();
  }

  // Admin-triggered catalog refresh (FR-21a).
  @Post('sync')
  @Roles('ADMIN')
  sync(
    @Body(new ZodValidationPipe(CloudSyncRequest)) dto: CloudSyncRequest,
    @CurrentUser() u: AuthUser,
  ) {
    return this.prices.sync(dto.provider, u.id);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.prices.get(id);
  }
}
