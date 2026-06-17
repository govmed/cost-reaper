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
  CaptureBaselineRequest,
  CommentInput,
  CloudLineInput,
  CreateEstimateRequest,
  EstimateListQuery,
  LaborLineInput,
  NonLaborLineInput,
  UpdateEstimateRequest,
} from '@cost-reaper/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
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

  @Get(':id/export-excel')
  async exportExcel(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const { filename, xlsx } = await this.estimates.exportExcel(id);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(xlsx);
  }

  @Post()
  @RequirePermission('estimate.author')
  create(
    @Body(new ZodValidationPipe(CreateEstimateRequest)) dto: CreateEstimateRequest,
    @CurrentUser() u: AuthUser,
  ) {
    return this.estimates.create(dto, u.id);
  }

  @Patch(':id')
  @RequirePermission('estimate.author')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateEstimateRequest)) dto: UpdateEstimateRequest,
    @CurrentUser() u: AuthUser,
  ) {
    return this.estimates.update(id, dto, u.id);
  }

  @Delete(':id')
  @RequirePermission('estimate.author')
  @HttpCode(204)
  remove(@Param('id') id: string, @CurrentUser() u: AuthUser) {
    return this.estimates.remove(id, u.id);
  }

  @Post(':id/clone')
  @RequirePermission('estimate.author')
  clone(@Param('id') id: string, @CurrentUser() u: AuthUser) {
    return this.estimates.clone(id, u.id);
  }

  // Scenarios (FR-14): create a linked variant, and list the comparison group.
  @Post(':id/scenarios')
  @RequirePermission('estimate.author')
  createScenario(@Param('id') id: string, @CurrentUser() u: AuthUser) {
    return this.estimates.clone(id, u.id, true);
  }

  @Get(':id/scenarios')
  scenarios(@Param('id') id: string) {
    return this.estimates.scenarios(id);
  }

  // Versioning / baselines (FR-15).
  @Post(':id/baselines')
  @RequirePermission('estimate.author')
  captureBaseline(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CaptureBaselineRequest)) dto: CaptureBaselineRequest,
    @CurrentUser() u: AuthUser,
  ) {
    return this.estimates.captureBaseline(id, dto, u);
  }

  @Get(':id/baselines')
  baselines(@Param('id') id: string) {
    return this.estimates.listBaselines(id);
  }

  @Delete(':id/baselines/:baselineId')
  @RequirePermission('estimate.author')
  delBaseline(
    @Param('id') id: string,
    @Param('baselineId') baselineId: string,
    @CurrentUser() u: AuthUser,
  ) {
    return this.estimates.deleteBaseline(id, baselineId, u.id);
  }

  // ── Line items ───────────────────────────────────────────────────────────────
  @Post(':id/labor-items')
  @RequirePermission('estimate.author')
  addLabor(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(LaborLineInput)) dto: LaborLineInput,
    @CurrentUser() u: AuthUser,
  ) {
    return this.estimates.addLabor(id, dto, u.id);
  }

  @Delete(':id/labor-items/:itemId')
  @RequirePermission('estimate.author')
  delLabor(@Param('id') id: string, @Param('itemId') itemId: string, @CurrentUser() u: AuthUser) {
    return this.estimates.deleteLabor(id, itemId, u.id);
  }

  @Post(':id/non-labor-items')
  @RequirePermission('estimate.author')
  addNonLabor(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(NonLaborLineInput)) dto: NonLaborLineInput,
    @CurrentUser() u: AuthUser,
  ) {
    return this.estimates.addNonLabor(id, dto, u.id);
  }

  @Delete(':id/non-labor-items/:itemId')
  @RequirePermission('estimate.author')
  delNonLabor(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @CurrentUser() u: AuthUser,
  ) {
    return this.estimates.deleteNonLabor(id, itemId, u.id);
  }

  @Post(':id/cloud-items')
  @RequirePermission('estimate.author')
  addCloud(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CloudLineInput)) dto: CloudLineInput,
    @CurrentUser() u: AuthUser,
  ) {
    return this.estimates.addCloud(id, dto, u.id);
  }

  @Delete(':id/cloud-items/:itemId')
  @RequirePermission('estimate.author')
  delCloud(@Param('id') id: string, @Param('itemId') itemId: string, @CurrentUser() u: AuthUser) {
    return this.estimates.deleteCloud(id, itemId, u.id);
  }

  @Post(':id/assumptions')
  @RequirePermission('estimate.author')
  addAssumption(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AssumptionInput)) dto: AssumptionInput,
    @CurrentUser() u: AuthUser,
  ) {
    return this.estimates.addAssumption(id, dto, u.id);
  }

  @Delete(':id/assumptions/:itemId')
  @RequirePermission('estimate.author')
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
