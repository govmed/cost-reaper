import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type AuthUser, CreateSowRequest, UpdateSowRequest } from '@cost-reaper/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { SowService } from './sow.service';

// BR-7 — Statement of Work: an editable, official document composed from an
// estimate, printed to an official/legal PDF. Authoring is Admin/Estimator;
// Viewers may read. Issuing locks the document and snapshots its pricing.
@ApiTags('statements-of-work')
@ApiBearerAuth()
@Controller('sow')
export class SowController {
  constructor(private readonly sow: SowService) {}

  @Get()
  list() {
    return this.sow.list();
  }

  // Static path declared before ':id' so it isn't captured by the param route.
  @Get('eligible-estimates')
  eligibleEstimates() {
    return this.sow.eligibleEstimates();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.sow.get(id);
  }

  @Post()
  @Roles('ADMIN', 'ESTIMATOR')
  create(
    @Body(new ZodValidationPipe(CreateSowRequest)) dto: CreateSowRequest,
    @CurrentUser() u: AuthUser,
  ) {
    return this.sow.create(dto, u);
  }

  @Patch(':id')
  @Roles('ADMIN', 'ESTIMATOR')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateSowRequest)) dto: UpdateSowRequest,
    @CurrentUser() u: AuthUser,
  ) {
    return this.sow.update(id, dto, u);
  }

  @Post(':id/issue')
  @Roles('ADMIN', 'ESTIMATOR')
  issue(@Param('id') id: string, @CurrentUser() u: AuthUser) {
    return this.sow.issue(id, u);
  }

  @Post(':id/revert')
  @Roles('ADMIN', 'ESTIMATOR')
  revert(@Param('id') id: string, @CurrentUser() u: AuthUser) {
    return this.sow.revert(id, u);
  }

  @Delete(':id')
  @Roles('ADMIN', 'ESTIMATOR')
  remove(@Param('id') id: string, @CurrentUser() u: AuthUser) {
    return this.sow.remove(id, u);
  }
}
