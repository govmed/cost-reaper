import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import configuration from './config/configuration';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuditModule } from './common/audit/audit.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ProblemDetailsFilter } from './common/http/http-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { HealthModule } from './modules/health/health.module';
import { RolesModule } from './modules/roles/roles.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RateCardsModule } from './modules/rate-cards/rate-cards.module';
import { CloudPricingModule } from './modules/cloud-pricing/cloud-pricing.module';
import { EstimatesModule } from './modules/estimates/estimates.module';
import { SowModule } from './modules/sow/sow.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { ReferenceModule } from './modules/reference/reference.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { FxModule } from './modules/fx/fx.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    PrismaModule,
    AuditModule,
    HealthModule,
    AuthModule,
    UsersModule,
    RateCardsModule,
    CloudPricingModule,
    EstimatesModule,
    SowModule,
    WorkflowModule,
    ReferenceModule,
    DashboardModule,
    FxModule,
    RolesModule,
    DocumentsModule,
  ],
  providers: [
    // Auth runs first (authenticate), then RBAC (authorize) — deny-by-default (NFR-16).
    // RolesGuard enforces any legacy @Roles(); PermissionsGuard enforces FR-30
    // @RequirePermission() against the data-driven roles table.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(SecurityHeadersMiddleware, CorrelationIdMiddleware).forRoutes('*');
  }
}
