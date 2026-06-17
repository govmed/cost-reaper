/**
 * Assumptions, Comments, Reference-data & FX cards — contract QA
 * (FR-8, FR-19, FR-29/NFR-17, FR-12/FR-17). 54 cases against `AssumptionInput`,
 * `CommentInput`, the reference-data contracts (+ UPPER_SNAKE code rule), and the
 * FX rate contract + `scaleMoney` conversion math.
 */
import { describe, it, expect } from 'vitest';
import {
  AssumptionInput,
  CommentInput,
  CreateReferenceTypeRequest,
  CreateReferenceValueRequest,
  UpdateReferenceValueRequest,
  UpdateFxRateRequest,
} from '@cost-reaper/types';
import { scaleMoney } from '@cost-reaper/engine';

describe('Assumptions card (FR-8)', () => {
  it('TC-01 a non-empty assumption is valid', () => {
    expect(AssumptionInput.safeParse({ text: 'Assumes net-30 terms.' }).success).toBe(true);
  });
  it('TC-02 rejects an empty assumption', () => {
    expect(AssumptionInput.safeParse({ text: '' }).success).toBe(false);
  });
  it('TC-03 rejects a missing text field', () => {
    expect(AssumptionInput.safeParse({}).success).toBe(false);
  });
  it('TC-04 accepts a 2000-char assumption', () => {
    expect(AssumptionInput.safeParse({ text: 'a'.repeat(2000) }).success).toBe(true);
  });
  it('TC-05 rejects an assumption over 2000 chars', () => {
    expect(AssumptionInput.safeParse({ text: 'a'.repeat(2001) }).success).toBe(false);
  });
  it('TC-06 accepts a single character', () => {
    expect(AssumptionInput.safeParse({ text: 'x' }).success).toBe(true);
  });
  it('TC-07 rejects a non-string text', () => {
    expect(AssumptionInput.safeParse({ text: 123 }).success).toBe(false);
  });
  it('TC-08 accepts multi-line text', () => {
    expect(AssumptionInput.safeParse({ text: 'line1\nline2' }).success).toBe(true);
  });
});

describe('Comments card (FR-19)', () => {
  it('TC-09 a non-empty comment is valid', () => {
    expect(CommentInput.safeParse({ text: 'Looks good to me.' }).success).toBe(true);
  });
  it('TC-10 rejects an empty comment', () => {
    expect(CommentInput.safeParse({ text: '' }).success).toBe(false);
  });
  it('TC-11 accepts a 4000-char comment', () => {
    expect(CommentInput.safeParse({ text: 'c'.repeat(4000) }).success).toBe(true);
  });
  it('TC-12 rejects a comment over 4000 chars', () => {
    expect(CommentInput.safeParse({ text: 'c'.repeat(4001) }).success).toBe(false);
  });
  it('TC-13 rejects a missing text', () => {
    expect(CommentInput.safeParse({}).success).toBe(false);
  });
  it('TC-14 comments allow more text than assumptions (4000 vs 2000)', () => {
    expect(CommentInput.safeParse({ text: 'c'.repeat(2500) }).success).toBe(true);
    expect(AssumptionInput.safeParse({ text: 'c'.repeat(2500) }).success).toBe(false);
  });
  it('TC-15 accepts emoji/unicode', () => {
    expect(CommentInput.safeParse({ text: '👍 ready to ship' }).success).toBe(true);
  });
});

describe('Reference-data card — types (FR-29)', () => {
  const t = (o: Record<string, unknown> = {}) => ({
    code: 'SDLC_PHASE',
    displayName: 'SDLC Phase',
    ...o,
  });
  it('TC-16 a valid reference type is accepted', () => {
    expect(CreateReferenceTypeRequest.safeParse(t()).success).toBe(true);
  });
  it('TC-17 displayOrder defaults to 0', () => {
    expect(CreateReferenceTypeRequest.parse(t()).displayOrder).toBe(0);
  });
  it('TC-18 accepts a description', () => {
    expect(CreateReferenceTypeRequest.safeParse(t({ description: 'phases' })).success).toBe(true);
  });
  it('TC-19 rejects a lowercase code', () => {
    expect(CreateReferenceTypeRequest.safeParse(t({ code: 'sdlc_phase' })).success).toBe(false);
  });
  it('TC-20 rejects a code with a hyphen', () => {
    expect(CreateReferenceTypeRequest.safeParse(t({ code: 'SDLC-PHASE' })).success).toBe(false);
  });
  it('TC-21 rejects an empty code', () => {
    expect(CreateReferenceTypeRequest.safeParse(t({ code: '' })).success).toBe(false);
  });
  it('TC-22 accepts a code with digits', () => {
    expect(CreateReferenceTypeRequest.safeParse(t({ code: 'TIER_1' })).success).toBe(true);
  });
  it('TC-23 rejects an empty displayName', () => {
    expect(CreateReferenceTypeRequest.safeParse(t({ displayName: '' })).success).toBe(false);
  });
  it('TC-24 rejects a code over 80 chars', () => {
    expect(CreateReferenceTypeRequest.safeParse(t({ code: 'A'.repeat(81) })).success).toBe(false);
  });
  it('TC-25 rejects a negative displayOrder', () => {
    expect(CreateReferenceTypeRequest.safeParse(t({ displayOrder: -1 })).success).toBe(false);
  });
});

describe('Reference-data card — values (FR-29, parent/child)', () => {
  const v = (o: Record<string, unknown> = {}) => ({
    code: 'PLANNING',
    displayName: 'Planning',
    ...o,
  });
  const UUID = '550e8400-e29b-41d4-a716-446655440000';
  it('TC-26 a valid reference value is accepted', () => {
    expect(CreateReferenceValueRequest.safeParse(v()).success).toBe(true);
  });
  it('TC-27 accepts a parentId (hierarchy: phase → task)', () => {
    expect(CreateReferenceValueRequest.safeParse(v({ parentId: UUID })).success).toBe(true);
  });
  it('TC-28 accepts a null parentId (top-level value)', () => {
    expect(CreateReferenceValueRequest.safeParse(v({ parentId: null })).success).toBe(true);
  });
  it('TC-29 accepts metadata', () => {
    expect(CreateReferenceValueRequest.safeParse(v({ metadata: { color: 'blue' } })).success).toBe(
      true,
    );
  });
  it('TC-30 rejects a non-uuid parentId', () => {
    expect(CreateReferenceValueRequest.safeParse(v({ parentId: 'parent-1' })).success).toBe(false);
  });
  it('TC-31 rejects a lowercase code', () => {
    expect(CreateReferenceValueRequest.safeParse(v({ code: 'planning' })).success).toBe(false);
  });
  it('TC-32 accepts a 160-char displayName', () => {
    expect(CreateReferenceValueRequest.safeParse(v({ displayName: 'n'.repeat(160) })).success).toBe(
      true,
    );
  });
  it('TC-33 rejects a 161-char displayName', () => {
    expect(CreateReferenceValueRequest.safeParse(v({ displayName: 'n'.repeat(161) })).success).toBe(
      false,
    );
  });
  it('TC-34 value update may deactivate (soft-delete)', () => {
    expect(UpdateReferenceValueRequest.safeParse({ isActive: false }).success).toBe(true);
  });
  it('TC-35 value update may re-sequence via displayOrder', () => {
    expect(UpdateReferenceValueRequest.safeParse({ displayOrder: 5 }).success).toBe(true);
  });
  it('TC-36 value update may rename the label (no code change)', () => {
    expect(UpdateReferenceValueRequest.safeParse({ displayName: 'Renamed' }).success).toBe(true);
  });
  it('TC-37 value update rejects a negative displayOrder', () => {
    expect(UpdateReferenceValueRequest.safeParse({ displayOrder: -2 }).success).toBe(false);
  });
  it('TC-38 value update may be empty', () => {
    expect(UpdateReferenceValueRequest.safeParse({}).success).toBe(true);
  });
});

describe('FX card — rate contract (FR-12/FR-17)', () => {
  it('TC-39 a positive decimal rate is valid', () => {
    expect(UpdateFxRateRequest.safeParse({ rateToBase: '1.0850' }).success).toBe(true);
  });
  it('TC-40 an integer rate string is valid', () => {
    expect(UpdateFxRateRequest.safeParse({ rateToBase: '1' }).success).toBe(true);
  });
  it('TC-41 rejects a negative rate', () => {
    expect(UpdateFxRateRequest.safeParse({ rateToBase: '-1.1' }).success).toBe(false);
  });
  it('TC-42 rejects a non-numeric rate', () => {
    expect(UpdateFxRateRequest.safeParse({ rateToBase: 'par' }).success).toBe(false);
  });
  it('TC-43 rejects a numeric (non-string) rate', () => {
    expect(UpdateFxRateRequest.safeParse({ rateToBase: 1.1 }).success).toBe(false);
  });
  it('TC-44 accepts a high-precision rate', () => {
    expect(UpdateFxRateRequest.safeParse({ rateToBase: '0.000123' }).success).toBe(true);
  });
});

describe('FX card — conversion math (scaleMoney)', () => {
  it('TC-45 converts at a 1.1 rate', () => {
    expect(scaleMoney('100', '1.1')).toBe('110.0000');
  });
  it('TC-46 identity rate leaves the amount unchanged', () => {
    expect(scaleMoney('100', '1')).toBe('100.0000');
  });
  it('TC-47 converts down at a sub-1 rate', () => {
    expect(scaleMoney('100', '0.85')).toBe('85.0000');
  });
  it('TC-48 zero amount stays zero', () => {
    expect(scaleMoney('0', '1.25')).toBe('0.0000');
  });
  it('TC-49 keeps exact decimals', () => {
    expect(scaleMoney('33.33', '3')).toBe('99.9900');
  });
  it('TC-50 rounds half-up at 4 dp', () => {
    expect(scaleMoney('100', '1.00005')).toBe('100.0050');
  });
  it('TC-51 honors a custom scale', () => {
    expect(scaleMoney('100', '1.1', 2)).toBe('110.00');
  });
  it('TC-52 large amount conversion', () => {
    expect(scaleMoney('1000000', '1.2')).toBe('1200000.0000');
  });
  it('TC-53 conversion is deterministic', () => {
    expect(scaleMoney('250', '1.37')).toBe(scaleMoney('250', '1.37'));
  });
  it('TC-54 a tiny rate converts precisely', () => {
    expect(scaleMoney('1000', '0.0011')).toBe('1.1000');
  });
});
