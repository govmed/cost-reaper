import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '@cost-reaper/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  // Summary is available to any authenticated user (read-only aggregation);
  // a GM's view is scoped to their review queue + their own recent activity.
  @Get()
  summary(@CurrentUser() user: AuthUser) {
    return this.dashboard.summary(user);
  }

  // Drill-down: estimates currently in a given workflow stage.
  @Get('stage/:stageKey')
  estimatesInStage(@Param('stageKey') stageKey: string, @CurrentUser() user: AuthUser) {
    return this.dashboard.estimatesInStage(stageKey, user);
  }
}
