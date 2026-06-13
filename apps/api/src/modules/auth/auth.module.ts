import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LoginThrottleGuard } from '../../common/guards/login-throttle.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  // global: makes JwtService available to the app-wide JwtAuthGuard.
  imports: [JwtModule.register({ global: true })],
  controllers: [AuthController],
  providers: [AuthService, LoginThrottleGuard],
})
export class AuthModule {}
