import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import {
  AssumptionInput,
  type AuthUser,
  CommentInput,
  CloudLineInput,
  CreateEstimateRequest,
  EstimateListQuery,
  LaborLineInput,
  NonLaborLineInput,
  UpdateEstimateRequest,
} from '@cost-reaper/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { EstimatesService } from './estimates.service';

@ApiTags('estimates')
@ApiBearerAuth()
@Controller('estimates')
export class EstimatesController {
  constructor(private readonly estimates: EstimatesService) {}

  @Get()
  list(@Query(new ZodValidationPipe(EstimateListQuery)) query: EstimateListQuery) {
    return this.estimates.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.estimates.getDetail(id);
  }

  @Get(':id/totals')
  totals(@Param('id') id: string) {
    return this.estimates.totals(id);
  }

  @Get(':id/export')
  async exportCsv(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const { filename, csv } = await this.estimates.exportCsv(id);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  @Post()
  @Roles('ADMIN', 'ESTIMATOR')
  create(
    @Body(new ZodValidationPipe(CreateEstimateRequest)) dto: CreateEstimateRequest,
    @CurrentUser() u: AuthUser,
  ) {
    return this.estimates.create(dto, u.id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'ESTIMATOR')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateEstimateRequest)) dto: UpdateEstimateRequest,
    @CurrentUser() u: AuthUser,
  ) {
    return this.estimates.update(id, dto, u.id);
  }

  @Delete(':id')
  @Roles('ADMIN', 'ESTIMATOR')
  @HttpCode(204)
  remove(@Param('id') id: string, @CurrentUser() u: AuthUser) {
    return this.estimates.remove(id, u.id);
  }

  @Post(':id/clone')
  @Roles('ADMIN', 'ESTIMATOR')
  clone(@Param('id') id: string, @CurrentUser() u: AuthUser) {
    return this.estimates.clone(id, u.id);
  }

  // ── Line items ───────────────────────────────────────────────────────────────
  @Post(':id/labor-items')
  @Roles('ADMIN', 'ESTIMATOR')
  addLabor(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(LaborLineInput)) dto: LaborLineInput,
    @CurrentUser() u: AuthUser,
  ) {
    return this.estimates.addLabor(id, dto, u.id);
  }

  @Delete(':id/labor-items/:itemId')
  @Roles('ADMIN', 'ESTIMATOR')
  delLabor(@Param('id') id: string, @Param('itemId') itemId: string, @CurrentUser() u: AuthUser) {
    return this.estimates.deleteLabor(id, itemId, u.id);
  }

  @Post(':id/non-labor-items')
  @Roles('ADMIN', 'ESTIMATOR')
  addNonLabor(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(NonLaborLineInput)) dto: NonLaborLineInput,
    @CurrentUser() u: AuthUser,
  ) {
    return this.estimates.addNonLabor(id, dto, u.id);
  }

  @Delete(':id/non-labor-items/:itemId')
  @Roles('ADMIN', 'ESTIMATOR')
  delNonLabor(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @CurrentUser() u: AuthUser,
  ) {
    return this.estimates.deleteNonLabor(id, itemId, u.id);
  }

  @Post(':id/cloud-items')
  @Roles('ADMIN', 'ESTIMATOR')
  addCloud(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CloudLineInput)) dto: CloudLineInput,
    @CurrentUser() u: AuthUser,
  ) {
    return this.estimates.addCloud(id, dto, u.id);
  }

  @Delete(':id/cloud-items/:itemId')
  @Roles('ADMIN', 'ESTIMATOR')
  delCloud(@Param('id') id: string, @Param('itemId') itemId: string, @CurrentUser() u: AuthUser) {
    return this.estimates.deleteCloud(id, itemId, u.id);
  }

  @Post(':id/assumptions')
  @Roles('ADMIN', 'ESTIMATOR')
  addAssumption(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AssumptionInput)) dto: AssumptionInput,
    @CurrentUser() u: AuthUser,
  ) {
    return this.estimates.addAssumption(id, dto, u.id);
  }

  @Delete(':id/assumptions/:itemId')
  @Roles('ADMIN', 'ESTIMATOR')
  delAssumption(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @CurrentUser() u: AuthUser,
  ) {
    return this.estimates.deleteAssumption(id, itemId, u.id);
  }

  // Comments (FR-19) — any authenticated role can comment; author or admin can delete.
  @Post(':id/comments')
  addComment(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CommentInput)) dto: CommentInput,
    @CurrentUser() u: AuthUser,
  ) {
    return this.estimates.addComment(id, dto, u);
  }

  @Delete(':id/comments/:commentId')
  delComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @CurrentUser() u: AuthUser,
  ) {
    return this.estimates.deleteComment(id, commentId, u);
  }
}
