import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  // Summary is available to any authenticated user (read-only aggregation).
  @Get()
  summary() {
    return this.dashboard.summary();
  }

  // Drill-down: estimates currently in a given workflow stage.
  @Get('stage/:stageKey')
  estimatesInStage(@Param('stageKey') stageKey: string) {
    return this.dashboard.estimatesInStage(stageKey);
  }
}
