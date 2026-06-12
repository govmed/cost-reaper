import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CloudPriceQuery } from '@cost-reaper/types';
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

  @Get(':id')
  get(@Param('id') id: string) {
    return this.prices.get(id);
  }
}
