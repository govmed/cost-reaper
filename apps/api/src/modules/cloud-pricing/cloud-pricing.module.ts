import { Module } from '@nestjs/common';
import { CloudPricesController } from './cloud-prices.controller';
import { CloudPricesService } from './cloud-prices.service';

@Module({
  controllers: [CloudPricesController],
  providers: [CloudPricesService],
})
export class CloudPricingModule {}
