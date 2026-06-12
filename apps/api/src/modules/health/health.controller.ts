import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /** Liveness probe (FE-5, NFR-3). Served at root `/health`. */
  @Get('health')
  @ApiOkResponse({ description: 'Service is alive.' })
  liveness() {
    return this.healthService.liveness();
  }

  /** Readiness probe (FE-5, NFR-3). Served at root `/ready`; checks the DB. */
  @Get('ready')
  @ApiOkResponse({ description: 'Service (and its dependencies) are ready.' })
  readiness() {
    return this.healthService.readiness();
  }
}
