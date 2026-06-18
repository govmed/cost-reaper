import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LoginThrottleGuard } from '../../common/guards/login-throttle.guard';
import { RolesModule } from '../roles/roles.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SsoController } from './sso/sso.controller';
import { SsoService } from './sso/sso.service';

@Module({
  // global: makes JwtService available to the app-wide JwtAuthGuard.
  // RolesModule: resolve a user's permissions for the login response (FR-30).
  imports: [JwtModule.register({ global: true }), RolesModule],
  controllers: [AuthController, SsoController],
  providers: [AuthService, SsoService, LoginThrottleGuard],
})
export class AuthModule {}
