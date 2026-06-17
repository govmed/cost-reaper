import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  type AuthUser,
  CreateRoleRequest,
  PERMISSIONS,
  UpdateRoleRequest,
} from '@cost-reaper/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { RolesService } from './roles.service';

// Data-driven roles & permission catalog (FR-30). Managing roles is itself a
// permission (`roles.manage`); the permission catalog is readable by any
// authenticated user so the UI can render it.
@ApiTags('roles')
@ApiBearerAuth()
@Controller()
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get('permissions')
  catalog() {
    return PERMISSIONS;
  }

  @Get('roles')
  list() {
    return this.roles.list();
  }

  @Post('roles')
  @RequirePermission('roles.manage')
  create(
    @Body(new ZodValidationPipe(CreateRoleRequest)) dto: CreateRoleRequest,
    @CurrentUser() u: AuthUser,
  ) {
    return this.roles.create(dto, u);
  }

  @Patch('roles/:id')
  @RequirePermission('roles.manage')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateRoleRequest)) dto: UpdateRoleRequest,
    @CurrentUser() u: AuthUser,
  ) {
    return this.roles.update(id, dto, u);
  }

  @Delete('roles/:id')
  @RequirePermission('roles.manage')
  @HttpCode(204)
  remove(@Param('id') id: string, @CurrentUser() u: AuthUser) {
    return this.roles.remove(id, u);
  }
}
