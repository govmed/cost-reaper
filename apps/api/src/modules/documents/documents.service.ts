import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { EstimateDocumentDto } from '@cost-reaper/types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { ReferenceService } from '../reference/reference.service';
import { SettingsService } from '../settings/settings.service';

/** A multipart upload as populated by multer (memory storage). */
export interface UploadedDoc {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/**
 * Supporting documents for an estimate (FR-29). Files are stored in-DB (bytea);
 * the document type is validated against the DOCUMENT_TYPE reference set.
 */
@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly reference: ReferenceService,
    private readonly settings: SettingsService,
  ) {}

  private async ensureEstimate(estimateId: string): Promise<void> {
    const est = await this.prisma.estimate.findUnique({
      where: { id: estimateId },
      select: { id: true },
    });
    if (!est) throw new NotFoundException('Estimate not found');
  }

  /**
   * Documents may only be added/removed while the estimate is editable — i.e. in
   * its workflow's initial (Draft) stage. Once it's In Review / Approved / Final /
   * Archived its supporting documents are locked, consistent with the estimate's
   * line items (FR-24).
   */
  private async ensureEditable(estimateId: string): Promise<void> {
    const est = await this.prisma.estimate.findUnique({
      where: { id: estimateId },
      select: { id: true, currentStage: { select: { isInitial: true, label: true } } },
    });
    if (!est) throw new NotFoundException('Estimate not found');
    if (est.currentStage && !est.currentStage.isInitial) {
      throw new ConflictException(
        `This estimate is locked while in "${est.currentStage.label}". Return it to Draft to change its documents.`,
      );
    }
  }

  async list(estimateId: string): Promise<EstimateDocumentDto[]> {
    await this.ensureEstimate(estimateId);
    const rows = await this.prisma.estimateDocument.findMany({
      where: { estimateId },
      // Never select `content` here — it's the (potentially large) file bytes.
      select: {
        id: true,
        fileName: true,
        documentType: true,
        description: true,
        contentType: true,
        sizeBytes: true,
        uploadedAt: true,
        uploadedBy: { select: { email: true } },
      },
      orderBy: { uploadedAt: 'desc' },
    });
    return rows.map((r) => ({
      id: r.id,
      fileName: r.fileName,
      documentType: r.documentType,
      description: r.description,
      contentType: r.contentType,
      sizeBytes: r.sizeBytes,
      uploadedByEmail: r.uploadedBy?.email ?? null,
      uploadedAt: r.uploadedAt.toISOString(),
    }));
  }

  async create(
    estimateId: string,
    file: UploadedDoc | undefined,
    documentType: string,
    description: string | undefined,
    userId: string,
  ): Promise<EstimateDocumentDto[]> {
    await this.ensureEditable(estimateId);
    if (!file || !file.buffer?.length) throw new BadRequestException('A file is required');
    const limitMb = await this.settings.getDocumentUploadLimitMb();
    if (file.size > limitMb * 1024 * 1024) {
      throw new BadRequestException(`File exceeds the ${limitMb} MB limit`);
    }
    if (!documentType) throw new BadRequestException('A document type is required');
    // Validate against the DOCUMENT_TYPE reference set (FR-29).
    await this.reference.assertActiveCode('DOCUMENT_TYPE', documentType);

    await this.prisma.estimateDocument.create({
      data: {
        estimateId,
        fileName: file.originalname.slice(0, 255),
        documentType,
        description: description?.trim().slice(0, 500) || null,
        contentType: file.mimetype || 'application/octet-stream',
        sizeBytes: file.size,
        content: file.buffer,
        uploadedById: userId,
      },
    });
    await this.audit.record('EstimateDocument', estimateId, 'UPLOAD', userId);
    return this.list(estimateId);
  }

  async download(
    estimateId: string,
    docId: string,
  ): Promise<{ fileName: string; contentType: string; content: Buffer }> {
    const d = await this.prisma.estimateDocument.findFirst({
      where: { id: docId, estimateId },
    });
    if (!d) throw new NotFoundException('Document not found');
    return { fileName: d.fileName, contentType: d.contentType, content: Buffer.from(d.content) };
  }

  async remove(estimateId: string, docId: string, userId: string): Promise<EstimateDocumentDto[]> {
    await this.ensureEditable(estimateId);
    const d = await this.prisma.estimateDocument.findFirst({
      where: { id: docId, estimateId },
      select: { id: true },
    });
    if (!d) throw new NotFoundException('Document not found');
    await this.prisma.estimateDocument.delete({ where: { id: docId } });
    await this.audit.record('EstimateDocument', estimateId, 'DELETE', userId);
    return this.list(estimateId);
  }
}
