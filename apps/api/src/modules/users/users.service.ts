import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import type { CreateUserRequest, UpdateUserRequest, UserDto } from '@cost-reaper/types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(): Promise<UserDto[]> {
    const users = await this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    return users.map((u) => this.toDto(u));
  }

  async create(dto: CreateUserRequest, actorId: string): Promise<UserDto> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: dto.role,
        displayName: dto.displayName ?? null,
      },
    });
    await this.audit.record('User', user.id, 'CREATE', actorId);
    return this.toDto(user);
  }

  async update(id: string, dto: UpdateUserRequest, actorId: string): Promise<UserDto> {
    await this.getOrThrow(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: { role: dto.role, isActive: dto.isActive, displayName: dto.displayName },
    });
    await this.audit.record('User', id, 'UPDATE', actorId);
    return this.toDto(user);
  }

  async remove(id: string, actorId: string): Promise<void> {
    await this.getOrThrow(id);
    await this.prisma.user.delete({ where: { id } });
    await this.audit.record('User', id, 'DELETE', actorId);
  }

  private async getOrThrow(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private toDto(u: {
    id: string;
    email: string;
    role: UserDto['role'];
    displayName: string | null;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserDto {
    return {
      id: u.id,
      email: u.email,
      role: u.role,
      displayName: u.displayName,
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    };
  }
}
