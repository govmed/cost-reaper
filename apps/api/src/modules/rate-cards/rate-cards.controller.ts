import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  type AuthUser,
  CreateRateCardRequest,
  RateCardRoleInput,
  UpdateRateCardRequest,
  UpdateRateCardRoleRequest,
} from '@cost-reaper/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { RateCardsService } from './rate-cards.service';

@ApiTags('rate-cards')
@ApiBearerAuth()
@Controller('rate-cards')
export class RateCardsController {
  constructor(private readonly rateCards: RateCardsService) {}

  // Any authenticated role may read governed rate cards.
  @Get()
  list() {
    return this.rateCards.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.rateCards.get(id);
  }

  @Post()
  @RequirePermission('ratecard.manage')
  create(
    @Body(new ZodValidationPipe(CreateRateCardRequest)) dto: CreateRateCardRequest,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.rateCards.create(dto, actor.id);
  }

  @Patch(':id')
  @RequirePermission('ratecard.manage')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateRateCardRequest)) dto: UpdateRateCardRequest,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.rateCards.update(id, dto, actor.id);
  }

  @Delete(':id')
  @RequirePermission('ratecard.manage')
  @HttpCode(204)
  remove(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.rateCards.remove(id, actor.id);
  }

  @Post(':id/roles')
  @RequirePermission('ratecard.manage')
  addRole(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(RateCardRoleInput)) dto: RateCardRoleInput,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.rateCards.addRole(id, dto, actor.id);
  }

  @Patch(':id/roles/:roleId')
  @RequirePermission('ratecard.manage')
  updateRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @Body(new ZodValidationPipe(UpdateRateCardRoleRequest)) dto: UpdateRateCardRoleRequest,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.rateCards.updateRole(id, roleId, dto, actor.id);
  }

  @Delete(':id/roles/:roleId')
  @RequirePermission('ratecard.manage')
  deleteRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.rateCards.deleteRole(id, roleId, actor.id);
  }
}
