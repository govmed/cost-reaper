import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type AuthUser, CreateRateCardRequest, UpdateRateCardRequest } from '@cost-reaper/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
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
  @Roles('ADMIN')
  create(
    @Body(new ZodValidationPipe(CreateRateCardRequest)) dto: CreateRateCardRequest,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.rateCards.create(dto, actor.id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateRateCardRequest)) dto: UpdateRateCardRequest,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.rateCards.update(id, dto, actor.id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(204)
  remove(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.rateCards.remove(id, actor.id);
  }
}
