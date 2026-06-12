import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  type AuthUser,
  CreateReferenceTypeRequest,
  CreateReferenceValueRequest,
  UpdateReferenceValueRequest,
} from '@cost-reaper/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ReferenceService } from './reference.service';

@ApiTags('reference')
@ApiBearerAuth()
@Controller('reference')
export class ReferenceController {
  constructor(private readonly reference: ReferenceService) {}

  // Reads are available to any authenticated user (consumed across the app).
  @Get('types')
  listTypes() {
    return this.reference.listTypes();
  }

  @Get('types/:code/values')
  getValues(@Param('code') code: string, @Query('all') all?: string) {
    return this.reference.getValues(code, all === 'true');
  }

  // Writes are admin-only and audited (FR-29 admin CRUD, NFR-16).
  @Post('types')
  @Roles('ADMIN')
  createType(
    @Body(new ZodValidationPipe(CreateReferenceTypeRequest)) dto: CreateReferenceTypeRequest,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.reference.createType(dto, actor.id);
  }

  @Post('types/:code/values')
  @Roles('ADMIN')
  createValue(
    @Param('code') code: string,
    @Body(new ZodValidationPipe(CreateReferenceValueRequest)) dto: CreateReferenceValueRequest,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.reference.createValue(code, dto, actor.id);
  }

  @Patch('values/:id')
  @Roles('ADMIN')
  updateValue(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateReferenceValueRequest)) dto: UpdateReferenceValueRequest,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.reference.updateValue(id, dto, actor.id);
  }

  @Delete('values/:id')
  @Roles('ADMIN')
  @HttpCode(204)
  deleteValue(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.reference.deleteValue(id, actor.id);
  }
}
