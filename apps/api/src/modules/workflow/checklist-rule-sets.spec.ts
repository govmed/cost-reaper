/**
 * Checklist Rule Sets card — FR-25 contract QA. Covers the rule-set repo
 * (create/update/DTO), rule authoring (create/update, the lower_snake_case key
 * rule), the severity/scope enums, and the gating result. Pure (no DB).
 */
import { describe, it, expect } from 'vitest';
import {
  ChecklistSeverity,
  ChecklistScope,
  ChecklistRuleSetDto,
  CreateChecklistRuleSetRequest,
  UpdateChecklistRuleSetRequest,
  ChecklistRuleDto,
  CreateChecklistRuleRequest,
  UpdateChecklistRuleRequest,
  ChecklistResult,
} from '@cost-reaper/types';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

// ─────────────────────────────────────────────────────────────────────────────
describe('Rule sets · severity enum', () => {
  it('CS-01 BLOCKER is valid', () => {
    expect(ChecklistSeverity.safeParse('BLOCKER').success).toBe(true);
  });
  it('CS-02 WARNING is valid', () => {
    expect(ChecklistSeverity.safeParse('WARNING').success).toBe(true);
  });
  it('CS-03 INFO is valid', () => {
    expect(ChecklistSeverity.safeParse('INFO').success).toBe(true);
  });
  it('CS-04 an unknown severity is rejected', () => {
    expect(ChecklistSeverity.safeParse('CRITICAL').success).toBe(false);
  });
  it('CS-05 a lowercase severity is rejected', () => {
    expect(ChecklistSeverity.safeParse('blocker').success).toBe(false);
  });
  it('CS-06 the enum has exactly the three severities', () => {
    expect([...ChecklistSeverity.options].sort()).toEqual(['BLOCKER', 'INFO', 'WARNING']);
  });
});

describe('Rule sets · scope enum', () => {
  it('CS-07 ESTIMATE is valid', () => {
    expect(ChecklistScope.safeParse('ESTIMATE').success).toBe(true);
  });
  it('CS-08 LABOR / NONLABOR / CLOUD / RESOURCE are valid', () => {
    for (const s of ['LABOR', 'NONLABOR', 'CLOUD', 'RESOURCE'])
      expect(ChecklistScope.safeParse(s).success).toBe(true);
  });
  it('CS-09 an unknown scope is rejected', () => {
    expect(ChecklistScope.safeParse('GLOBAL').success).toBe(false);
  });
  it('CS-10 the enum has exactly the five scopes', () => {
    expect(ChecklistScope.options).toHaveLength(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Rule sets · rule-set DTO', () => {
  const set = (o: Record<string, unknown> = {}) => ({
    id: UUID,
    key: 'RS-A1B2C3',
    name: 'Default checklist',
    description: 'The baseline rules',
    isDefault: true,
    isActive: true,
    ruleCount: 9,
    ...o,
  });
  it('CS-11 a complete rule-set DTO is valid', () => {
    expect(ChecklistRuleSetDto.safeParse(set()).success).toBe(true);
  });
  it('CS-12 a null description is allowed', () => {
    expect(ChecklistRuleSetDto.safeParse(set({ description: null })).success).toBe(true);
  });
  it('CS-13 ruleCount must be an integer', () => {
    expect(ChecklistRuleSetDto.safeParse(set({ ruleCount: 1.5 })).success).toBe(false);
  });
  it('CS-14 a non-uuid id is rejected', () => {
    expect(ChecklistRuleSetDto.safeParse(set({ id: 'rs-1' })).success).toBe(false);
  });
  it('CS-15 isDefault must be a boolean', () => {
    expect(ChecklistRuleSetDto.safeParse(set({ isDefault: 'yes' })).success).toBe(false);
  });
});

describe('Rule sets · create-rule-set contract', () => {
  const ok = (o: Record<string, unknown>) => CreateChecklistRuleSetRequest.safeParse(o).success;
  it('CS-16 minimal (name) is valid', () => {
    expect(ok({ name: 'Government SOW checks' })).toBe(true);
  });
  it('CS-17 with a description is valid', () => {
    expect(ok({ name: 'X', description: 'Stricter set for public-sector bids' })).toBe(true);
  });
  it('CS-18 rejects an empty name', () => {
    expect(ok({ name: '' })).toBe(false);
  });
  it('CS-19 rejects a missing name', () => {
    expect(CreateChecklistRuleSetRequest.safeParse({}).success).toBe(false);
  });
  it('CS-20 accepts a 1-char name', () => {
    expect(ok({ name: 'X' })).toBe(true);
  });
  it('CS-21 accepts an 80-char name', () => {
    expect(ok({ name: 'n'.repeat(80) })).toBe(true);
  });
  it('CS-22 rejects a name over 80 chars', () => {
    expect(ok({ name: 'n'.repeat(81) })).toBe(false);
  });
  it('CS-23 accepts a 500-char description', () => {
    expect(ok({ name: 'X', description: 'd'.repeat(500) })).toBe(true);
  });
  it('CS-24 rejects a description over 500 chars', () => {
    expect(ok({ name: 'X', description: 'd'.repeat(501) })).toBe(false);
  });
});

describe('Rule sets · update-rule-set contract', () => {
  const ok = (o: Record<string, unknown>) => UpdateChecklistRuleSetRequest.safeParse(o).success;
  it('CS-25 an empty update is valid (no-op)', () => {
    expect(ok({})).toBe(true);
  });
  it('CS-26 rename is valid', () => {
    expect(ok({ name: 'Renamed set' })).toBe(true);
  });
  it('CS-27 deactivate is valid', () => {
    expect(ok({ isActive: false })).toBe(true);
  });
  it('CS-28 reactivate is valid', () => {
    expect(ok({ isActive: true })).toBe(true);
  });
  it('CS-29 update name + description + active together', () => {
    expect(ok({ name: 'Full', description: 'desc', isActive: true })).toBe(true);
  });
  it('CS-30 rejects an empty name on update', () => {
    expect(ok({ name: '' })).toBe(false);
  });
  it('CS-31 rejects a description over 500 on update', () => {
    expect(ok({ description: 'd'.repeat(501) })).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Rule sets · rule DTO', () => {
  const rule = (o: Record<string, unknown> = {}) => ({
    id: UUID,
    key: 'rate_card_selected',
    description: 'A rate card is selected',
    severity: 'BLOCKER',
    scope: 'ESTIMATE',
    isActive: true,
    isBuiltin: true,
    ruleSetId: UUID,
    hasLogic: true,
    ...o,
  });
  it('CS-32 a complete built-in rule is valid', () => {
    expect(ChecklistRuleDto.safeParse(rule()).success).toBe(true);
  });
  it('CS-33 an advisory rule (hasLogic false, not built-in) is valid', () => {
    expect(ChecklistRuleDto.safeParse(rule({ isBuiltin: false, hasLogic: false })).success).toBe(
      true,
    );
  });
  it('CS-34 rejects a bad severity', () => {
    expect(ChecklistRuleDto.safeParse(rule({ severity: 'HIGH' })).success).toBe(false);
  });
  it('CS-35 rejects a bad scope', () => {
    expect(ChecklistRuleDto.safeParse(rule({ scope: 'GLOBAL' })).success).toBe(false);
  });
  it('CS-36 rejects a non-uuid ruleSetId', () => {
    expect(ChecklistRuleDto.safeParse(rule({ ruleSetId: 'rs' })).success).toBe(false);
  });
});

describe('Rule sets · create-rule contract (lower_snake_case key)', () => {
  const rule = (o: Record<string, unknown> = {}) => ({
    key: 'custom_check',
    description: 'My custom reminder',
    severity: 'WARNING',
    scope: 'ESTIMATE',
    ...o,
  });
  const ok = (o: Record<string, unknown>) => CreateChecklistRuleRequest.safeParse(o).success;
  it('CS-37 a valid rule is accepted', () => {
    expect(ok(rule())).toBe(true);
  });
  it('CS-38 accepts a key with digits and underscores', () => {
    expect(ok(rule({ key: 'check_2_pricing' }))).toBe(true);
  });
  it('CS-39 rejects an uppercase key', () => {
    expect(ok(rule({ key: 'CustomCheck' }))).toBe(false);
  });
  it('CS-40 rejects a hyphenated key', () => {
    expect(ok(rule({ key: 'custom-check' }))).toBe(false);
  });
  it('CS-41 rejects a key starting with a digit', () => {
    expect(ok(rule({ key: '2_check' }))).toBe(false);
  });
  it('CS-42 rejects a key with a space', () => {
    expect(ok(rule({ key: 'custom check' }))).toBe(false);
  });
  it('CS-43 rejects an empty key', () => {
    expect(ok(rule({ key: '' }))).toBe(false);
  });
  it('CS-44 rejects a key over 60 chars', () => {
    expect(ok(rule({ key: 'a'.repeat(61) }))).toBe(false);
  });
  it('CS-45 rejects an empty description', () => {
    expect(ok(rule({ description: '' }))).toBe(false);
  });
  it('CS-46 rejects a description over 200 chars', () => {
    expect(ok(rule({ description: 'd'.repeat(201) }))).toBe(false);
  });
  it('CS-47 rejects an unknown severity', () => {
    expect(ok(rule({ severity: 'CRITICAL' }))).toBe(false);
  });
  it('CS-48 rejects an unknown scope', () => {
    expect(ok(rule({ scope: 'EVERYTHING' }))).toBe(false);
  });
  it('CS-49 accepts an optional target ruleSetId', () => {
    expect(ok(rule({ ruleSetId: UUID }))).toBe(true);
  });
  it('CS-50 rejects a non-uuid ruleSetId', () => {
    expect(ok(rule({ ruleSetId: 'rs-1' }))).toBe(false);
  });
  it('CS-51 ruleSetId is optional (defaults to the default set)', () => {
    expect(ok(rule())).toBe(true);
    expect('ruleSetId' in CreateChecklistRuleRequest.parse(rule())).toBe(false);
  });
});

describe('Rule sets · update-rule contract', () => {
  const ok = (o: Record<string, unknown>) => UpdateChecklistRuleRequest.safeParse(o).success;
  it('CS-52 an empty update is valid', () => {
    expect(ok({})).toBe(true);
  });
  it('CS-53 re-tune the severity', () => {
    expect(ok({ severity: 'INFO' })).toBe(true);
  });
  it('CS-54 edit the description', () => {
    expect(ok({ description: 'Clearer wording' })).toBe(true);
  });
  it('CS-55 toggle active (deactivate a built-in)', () => {
    expect(ok({ isActive: false })).toBe(true);
  });
  it('CS-56 rejects an unknown severity', () => {
    expect(ok({ severity: 'HIGH' })).toBe(false);
  });
  it('CS-57 rejects an empty description', () => {
    expect(ok({ description: '' })).toBe(false);
  });
  it('CS-58 cannot change the key (no key field on update)', () => {
    const r = UpdateChecklistRuleRequest.parse({ description: 'x' } as Record<string, unknown>);
    expect('key' in r).toBe(false);
  });
});

describe('Rule sets · gating result (what a rule set produces)', () => {
  const item = (o: Record<string, unknown> = {}) => ({
    key: 'rate_card_selected',
    description: 'A rate card is selected',
    severity: 'BLOCKER',
    scope: 'ESTIMATE',
    passed: true,
    message: 'OK',
    ...o,
  });
  it('CS-59 a complete result parses; item defaults fill entityIds + applicable', () => {
    const r = ChecklistResult.parse({
      passed: true,
      blocking: false,
      completeness: 1,
      items: [item()],
    });
    expect(r.items[0].entityIds).toEqual([]);
    expect(r.items[0].applicable).toBe(true);
  });
  it('CS-60 completeness must be within 0..1', () => {
    expect(
      ChecklistResult.safeParse({ passed: true, blocking: false, completeness: 1.5, items: [] })
        .success,
    ).toBe(false);
  });
  it('CS-61 a blocking result (a BLOCKER failed) is well-formed', () => {
    const r = ChecklistResult.parse({
      passed: false,
      blocking: true,
      completeness: 0,
      items: [item({ passed: false, message: 'Select a rate card' })],
    });
    expect(r.blocking).toBe(true);
  });
});
