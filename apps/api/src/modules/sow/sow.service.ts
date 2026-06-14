import { randomBytes } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  AuthUser,
  CreateSowRequest,
  SowSummaryDto,
  StatementOfWorkDto,
  UpdateSowRequest,
} from '@cost-reaper/types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { EstimatesService } from '../estimates/estimates.service';

// Editable default boilerplate for a new SOW — the user tailors these before issuing.
const DEFAULT_SCOPE =
  'The Provider shall perform the professional services described in this Statement of Work ' +
  '(the “Services”) in accordance with the terms of the governing Master Services Agreement ' +
  'between the parties. Any work not expressly described herein is out of scope and requires a ' +
  'separate written change order.';
const DEFAULT_DELIVERABLES =
  '• Deliverable 1 — description and acceptance criteria\n' +
  '• Deliverable 2 — description and acceptance criteria\n' +
  '• Deliverable 3 — description and acceptance criteria';
const DEFAULT_TIMELINE =
  'The Services are expected to commence on the Effective Date and proceed per the milestones ' +
  'agreed by the parties. Dates are estimates and may be adjusted by mutual written agreement.';
const DEFAULT_PAYMENT_TERMS =
  'Fees are set out in the Pricing section below. Unless otherwise stated, invoices are issued ' +
  'monthly and are due net thirty (30) days from the invoice date. Amounts are exclusive of ' +
  'applicable taxes, which the Client shall pay where required by law.';
const DEFAULT_TERMS =
  '1. Confidentiality. Each party shall protect the other’s confidential information and use it ' +
  'solely to perform under this SOW.\n' +
  '2. Intellectual Property. Deliverables are assigned to the Client upon full payment, excluding ' +
  'the Provider’s pre-existing materials, which are licensed for the Client’s internal use.\n' +
  '3. Warranty. The Provider warrants the Services will be performed in a professional and ' +
  'workmanlike manner.\n' +
  '4. Limitation of Liability. Neither party is liable for indirect or consequential damages; ' +
  'each party’s aggregate liability is limited to the fees paid under this SOW.\n' +
  '5. Governing Law. This SOW is governed by the laws of the jurisdiction stated in the Master ' +
  'Services Agreement.\n' +
  '6. Entire Agreement. This SOW, together with the Master Services Agreement, is the entire ' +
  'agreement between the parties regarding its subject matter.';

@Injectable()
export class SowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly estimates: EstimatesService,
  ) {}

  private async toDto(sow: {
    id: string;
    number: string;
    estimateId: string;
    title: string;
    status: string;
    clientName: string;
    providerName: string;
    overview: string;
    scope: string;
    deliverables: string;
    timeline: string;
    paymentTerms: string;
    assumptions: string;
    termsAndConditions: string;
    effectiveDate: Date | null;
    issuedAt: Date | null;
    totalsSnapshot: Prisma.JsonValue | null;
    currencySnapshot: string | null;
    preparedByEmail: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<StatementOfWorkDto> {
    // Pricing: a draft reflects the estimate live; an issued SOW uses its snapshot.
    const detail: any = await this.estimates.getDetail(sow.estimateId);
    const useSnapshot = sow.status === 'ISSUED' && sow.totalsSnapshot;
    return {
      id: sow.id,
      number: sow.number,
      estimateId: sow.estimateId,
      estimateName: detail.name,
      title: sow.title,
      status: sow.status as StatementOfWorkDto['status'],
      clientName: sow.clientName,
      providerName: sow.providerName,
      overview: sow.overview,
      scope: sow.scope,
      deliverables: sow.deliverables,
      timeline: sow.timeline,
      paymentTerms: sow.paymentTerms,
      assumptions: sow.assumptions,
      termsAndConditions: sow.termsAndConditions,
      effectiveDate: sow.effectiveDate ? sow.effectiveDate.toISOString().slice(0, 10) : null,
      issuedAt: sow.issuedAt ? sow.issuedAt.toISOString() : null,
      preparedByEmail: sow.preparedByEmail,
      currency: useSnapshot ? (sow.currencySnapshot ?? detail.currency) : detail.currency,
      pricing: useSnapshot ? (sow.totalsSnapshot as StatementOfWorkDto['pricing']) : detail.totals,
      createdAt: sow.createdAt.toISOString(),
      updatedAt: sow.updatedAt.toISOString(),
    };
  }

  async list(): Promise<SowSummaryDto[]> {
    const rows = await this.prisma.statementOfWork.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { estimate: { select: { name: true } } },
    });
    return rows.map((s) => ({
      id: s.id,
      number: s.number,
      estimateId: s.estimateId,
      estimateName: s.estimate.name,
      title: s.title,
      status: s.status as SowSummaryDto['status'],
      clientName: s.clientName,
      updatedAt: s.updatedAt.toISOString(),
    }));
  }

  async get(id: string): Promise<StatementOfWorkDto> {
    const sow = await this.prisma.statementOfWork.findUnique({ where: { id } });
    if (!sow) throw new NotFoundException('Statement of Work not found');
    return this.toDto(sow);
  }

  async create(dto: CreateSowRequest, user: AuthUser): Promise<StatementOfWorkDto> {
    // getDetail throws NotFound if the estimate is missing.
    const detail: any = await this.estimates.getDetail(dto.estimateId);
    const number = `SOW-${randomBytes(3).toString('hex').toUpperCase()}`;
    const assumptionsText = (detail.assumptions ?? [])
      .map((a: { text: string }) => `• ${a.text}`)
      .join('\n');
    const sow = await this.prisma.statementOfWork.create({
      data: {
        estimateId: dto.estimateId,
        number,
        title: dto.title ?? `Statement of Work — ${detail.name}`,
        clientName: dto.clientName ?? '',
        providerName: dto.providerName ?? '',
        overview: detail.description ?? '',
        scope: DEFAULT_SCOPE,
        deliverables: DEFAULT_DELIVERABLES,
        timeline: DEFAULT_TIMELINE,
        paymentTerms: DEFAULT_PAYMENT_TERMS,
        assumptions: assumptionsText,
        termsAndConditions: DEFAULT_TERMS,
        preparedByEmail: user.email,
      },
    });
    await this.audit.record('StatementOfWork', number, 'CREATE', user.id);
    return this.toDto(sow);
  }

  async update(id: string, dto: UpdateSowRequest, user: AuthUser): Promise<StatementOfWorkDto> {
    const sow = await this.prisma.statementOfWork.findUnique({ where: { id } });
    if (!sow) throw new NotFoundException('Statement of Work not found');
    if (sow.status === 'ISSUED') {
      throw new BadRequestException('An issued SOW is locked; revert it to draft to edit.');
    }
    const effectiveDate =
      dto.effectiveDate === undefined
        ? undefined
        : dto.effectiveDate.trim() === ''
          ? null
          : new Date(dto.effectiveDate);
    const updated = await this.prisma.statementOfWork.update({
      where: { id },
      data: {
        title: dto.title,
        clientName: dto.clientName,
        providerName: dto.providerName,
        overview: dto.overview,
        scope: dto.scope,
        deliverables: dto.deliverables,
        timeline: dto.timeline,
        paymentTerms: dto.paymentTerms,
        assumptions: dto.assumptions,
        termsAndConditions: dto.termsAndConditions,
        effectiveDate,
      },
    });
    await this.audit.record('StatementOfWork', sow.number, 'UPDATE', user.id);
    return this.toDto(updated);
  }

  /** Lock the SOW and snapshot the estimate's pricing so the document is immutable. */
  async issue(id: string, user: AuthUser): Promise<StatementOfWorkDto> {
    const sow = await this.prisma.statementOfWork.findUnique({ where: { id } });
    if (!sow) throw new NotFoundException('Statement of Work not found');
    if (sow.status === 'ISSUED') throw new BadRequestException('This SOW is already issued.');
    const detail: any = await this.estimates.getDetail(sow.estimateId);
    const updated = await this.prisma.statementOfWork.update({
      where: { id },
      data: {
        status: 'ISSUED',
        issuedAt: new Date(),
        totalsSnapshot: detail.totals as Prisma.InputJsonValue,
        currencySnapshot: detail.currency,
      },
    });
    await this.audit.record('StatementOfWork', sow.number, 'ISSUE', user.id);
    return this.toDto(updated);
  }

  /** Reopen an issued SOW for editing (clears the lock; keeps the prior snapshot until re-issued). */
  async revert(id: string, user: AuthUser): Promise<StatementOfWorkDto> {
    const sow = await this.prisma.statementOfWork.findUnique({ where: { id } });
    if (!sow) throw new NotFoundException('Statement of Work not found');
    const updated = await this.prisma.statementOfWork.update({
      where: { id },
      data: { status: 'DRAFT', issuedAt: null },
    });
    await this.audit.record('StatementOfWork', sow.number, 'UPDATE', user.id);
    return this.toDto(updated);
  }

  async remove(id: string, user: AuthUser): Promise<void> {
    const sow = await this.prisma.statementOfWork.findUnique({ where: { id } });
    if (!sow) throw new NotFoundException('Statement of Work not found');
    await this.prisma.statementOfWork.delete({ where: { id } });
    await this.audit.record('StatementOfWork', sow.number, 'DELETE', user.id);
  }
}
