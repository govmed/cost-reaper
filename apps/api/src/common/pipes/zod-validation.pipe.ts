import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ZodError, ZodSchema } from 'zod';

/** Validates/parses request payloads against a shared Zod schema (Section 16). */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    try {
      return this.schema.parse(value);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException({
          error: 'Validation failed',
          message: err.errors.map((e) => `${e.path.join('.') || '(root)'}: ${e.message}`),
          errors: err.errors,
        });
      }
      throw err;
    }
  }
}
