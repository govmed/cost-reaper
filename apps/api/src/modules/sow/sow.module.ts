import { Module } from '@nestjs/common';
import { EstimatesModule } from '../estimates/estimates.module';
import { SowController } from './sow.controller';
import { SowService } from './sow.service';

@Module({
  imports: [EstimatesModule],
  controllers: [SowController],
  providers: [SowService],
})
export class SowModule {}
