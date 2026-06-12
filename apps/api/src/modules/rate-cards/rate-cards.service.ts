import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateRateCardRequest,
  RateCardDto,
  RateCardRoleInput,
  UpdateRateCardRequest,
  UpdateRateCardRoleRequest,
} from '@cost-reaper/types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';

@Injectable()
export class RateCardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(): Promise<RateCardDto[]> {
    const cards = await this.prisma.rateCard.findMany({
      include: { roles: true },
      orderBy: { createdAt: 'desc' },
    });
    return cards.map((c) => this.toDto(c));
  }

  async get(id: string): Promise<RateCardDto> {
    const card = await this.prisma.rateCard.findUnique({ where: { id }, include: { roles: true } });
    if (!card) throw new NotFoundException('Rate card not found');
    return this.toDto(card);
  }

  async create(dto: CreateRateCardRequest, actorId: string): Promise<RateCardDto> {
    const card = await this.prisma.rateCard.create({
      data: {
        name: dto.name,
        currency: dto.currency,
        createdById: actorId,
        roles: {
          create: dto.roles.map((r) => ({ roleName: r.roleName, unit: r.unit, rate: r.rate })),
        },
      },
      include: { roles: true },
    });
    await this.audit.record('RateCard', card.id, 'CREATE', actorId);
    return this.toDto(card);
  }

  async update(id: string, dto: UpdateRateCardRequest, actorId: string): Promise<RateCardDto> {
    await this.getEntityOrThrow(id);
    const card = await this.prisma.rateCard.update({
      where: { id },
      data: { name: dto.name, isActive: dto.isActive },
      include: { roles: true },
    });
    await this.audit.record('RateCard', id, 'UPDATE', actorId);
    return this.toDto(card);
  }

  async remove(id: string, actorId: string): Promise<void> {
    await this.getEntityOrThrow(id);
    await this.prisma.rateCard.delete({ where: { id } });
    await this.audit.record('RateCard', id, 'DELETE', actorId);
  }

  async addRole(cardId: string, dto: RateCardRoleInput, actorId: string): Promise<RateCardDto> {
    await this.getEntityOrThrow(cardId);
    await this.prisma.rateCardRole.create({
      data: { rateCardId: cardId, roleName: dto.roleName, unit: dto.unit, rate: dto.rate },
    });
    await this.audit.record('RateCard', cardId, 'ADD_ROLE', actorId);
    return this.get(cardId);
  }

  async updateRole(
    cardId: string,
    roleId: string,
    dto: UpdateRateCardRoleRequest,
    actorId: string,
  ): Promise<RateCardDto> {
    const role = await this.prisma.rateCardRole.findFirst({
      where: { id: roleId, rateCardId: cardId },
    });
    if (!role) throw new NotFoundException('Rate-card role not found');
    await this.prisma.rateCardRole.update({
      where: { id: roleId },
      data: { roleName: dto.roleName, unit: dto.unit, rate: dto.rate },
    });
    await this.audit.record('RateCard', cardId, 'UPDATE_ROLE', actorId);
    return this.get(cardId);
  }

  async deleteRole(cardId: string, roleId: string, actorId: string): Promise<RateCardDto> {
    await this.prisma.rateCardRole.deleteMany({ where: { id: roleId, rateCardId: cardId } });
    await this.audit.record('RateCard', cardId, 'DELETE_ROLE', actorId);
    return this.get(cardId);
  }

  private async getEntityOrThrow(id: string) {
    const card = await this.prisma.rateCard.findUnique({ where: { id } });
    if (!card) throw new NotFoundException('Rate card not found');
    return card;
  }

  private toDto(c: {
    id: string;
    name: string;
    currency: string;
    isActive: boolean;
    roles: {
      id: string;
      roleName: string;
      unit: RateCardDto['roles'][number]['unit'];
      rate: { toString(): string };
    }[];
    createdAt: Date;
    updatedAt: Date;
  }): RateCardDto {
    return {
      id: c.id,
      name: c.name,
      currency: c.currency,
      isActive: c.isActive,
      roles: c.roles.map((r) => ({
        id: r.id,
        roleName: r.roleName,
        unit: r.unit,
        rate: r.rate.toString(),
      })),
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }
}
