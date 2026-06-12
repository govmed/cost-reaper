import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import type { AuthUser, LoginRequest, RegisterRequest, TokenPair } from '@cost-reaper/types';
import { PrismaService } from '../../common/prisma/prisma.service';

interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: AuthUser['role'];
  displayName: string | null;
  isActive: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterRequest): Promise<{ user: AuthUser } & TokenPair> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await argon2.hash(dto.password);
    const user = (await this.prisma.user.create({
      data: { email: dto.email, passwordHash, displayName: dto.displayName ?? null },
    })) as unknown as UserRecord;
    return { user: this.toAuthUser(user), ...(await this.issueTokens(user)) };
  }

  async login(dto: LoginRequest): Promise<{ user: AuthUser } & TokenPair> {
    const user = (await this.prisma.user.findUnique({
      where: { email: dto.email },
    })) as unknown as UserRecord | null;
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');
    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return { user: this.toAuthUser(user), ...(await this.issueTokens(user)) };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    let payload: { sub: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, { secret: process.env.JWT_REFRESH_SECRET });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = (await this.prisma.user.findUnique({
      where: { id: payload.sub },
    })) as unknown as UserRecord | null;
    if (!user || !user.isActive) throw new UnauthorizedException('User not found or inactive');
    return this.issueTokens(user);
  }

  private async issueTokens(user: UserRecord): Promise<TokenPair> {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role, displayName: user.displayName },
      { secret: process.env.JWT_SECRET, expiresIn: `${process.env.ACCESS_TOKEN_TTL_MIN ?? '15'}m` },
    );
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id },
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: `${process.env.REFRESH_TOKEN_TTL_DAYS ?? '7'}d` },
    );
    return { accessToken, refreshToken };
  }

  private toAuthUser(user: UserRecord): AuthUser {
    return { id: user.id, email: user.email, role: user.role, displayName: user.displayName };
  }
}
