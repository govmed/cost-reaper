/**
 * Approval-workflow card — governance contract QA (FR-24, FR-2). 52 cases against
 * the workflow authoring + transition contracts (`CreateWorkflowRequest`,
 * `CreateStageRequest`, `CreateTransitionRequest`, `TransitionRequest`, …),
 * including role-gating (the GM approver) and the UPPER_SNAKE stage-key rule.
 */
import { describe, it, expect } from 'vitest';
import {
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
  CreateStageRequest,
  UpdateStageRequest,
  CreateTransitionRequest,
  UpdateTransitionRequest,
  TransitionRequest,
} from '@cost-reaper/types';

const stage = (o: Record<string, unknown> = {}) => ({ key: 'IN_REVIEW', label: 'In Review', ...o });
const transition = (o: Record<string, unknown> = {}) => ({
  fromStageKey: 'IN_REVIEW',
  toStageKey: 'APPROVED',
  allowedRole: 'GM',
  label: 'Approve',
  ...o,
});
const sOk = (o: Record<string, unknown>) => CreateStageRequest.safeParse(o).success;
const tOk = (o: Record<string, unknown>) => CreateTransitionRequest.safeParse(o).success;

describe('Workflow card · definition contract', () => {
  it('TC-01 minimal create (name) is valid', () => {
    expect(CreateWorkflowRequest.safeParse({ name: 'Client Approvals' }).success).toBe(true);
  });
  it('TC-02 accepts a description', () => {
    expect(CreateWorkflowRequest.safeParse({ name: 'X', description: 'desc' }).success).toBe(true);
  });
  it('TC-03 rejects an empty name', () => {
    expect(CreateWorkflowRequest.safeParse({ name: '' }).success).toBe(false);
  });
  it('TC-04 rejects a name over 80 chars', () => {
    expect(CreateWorkflowRequest.safeParse({ name: 'n'.repeat(81) }).success).toBe(false);
  });
  it('TC-05 rejects a description over 500 chars', () => {
    expect(
      CreateWorkflowRequest.safeParse({ name: 'X', description: 'd'.repeat(501) }).success,
    ).toBe(false);
  });
  it('TC-06 update may be empty', () => {
    expect(UpdateWorkflowRequest.safeParse({}).success).toBe(true);
  });
  it('TC-07 update can deactivate', () => {
    expect(UpdateWorkflowRequest.safeParse({ isActive: false }).success).toBe(true);
  });
  it('TC-08 update rejects an empty name', () => {
    expect(UpdateWorkflowRequest.safeParse({ name: '' }).success).toBe(false);
  });
});

describe('Workflow card · stage contract + UPPER_SNAKE keys', () => {
  it('TC-09 a valid stage is accepted', () => {
    expect(sOk(stage())).toBe(true);
  });
  it('TC-10 DRAFT key is valid', () => {
    expect(sOk(stage({ key: 'DRAFT', label: 'Draft' }))).toBe(true);
  });
  it('TC-11 a key with digits/underscores is valid', () => {
    expect(sOk(stage({ key: 'STAGE_2' }))).toBe(true);
  });
  it('TC-12 rejects a lowercase key', () => {
    expect(sOk(stage({ key: 'draft' }))).toBe(false);
  });
  it('TC-13 rejects a key with a hyphen', () => {
    expect(sOk(stage({ key: 'IN-REVIEW' }))).toBe(false);
  });
  it('TC-14 rejects a key that starts with a digit', () => {
    expect(sOk(stage({ key: '1STAGE' }))).toBe(false);
  });
  it('TC-15 rejects a key with spaces', () => {
    expect(sOk(stage({ key: 'IN REVIEW' }))).toBe(false);
  });
  it('TC-16 rejects an empty key', () => {
    expect(sOk(stage({ key: '' }))).toBe(false);
  });
  it('TC-17 rejects a key over 40 chars', () => {
    expect(sOk(stage({ key: 'A'.repeat(41) }))).toBe(false);
  });
  it('TC-18 rejects an empty label', () => {
    expect(sOk(stage({ label: '' }))).toBe(false);
  });
  it('TC-19 rejects a label over 80 chars', () => {
    expect(sOk(stage({ label: 'l'.repeat(81) }))).toBe(false);
  });
  it('TC-20 accepts isInitial/isTerminal flags', () => {
    expect(sOk(stage({ isInitial: true, isTerminal: false }))).toBe(true);
  });
  it('TC-21 accepts an explicit sortOrder', () => {
    expect(sOk(stage({ sortOrder: 3 }))).toBe(true);
  });
  it('TC-22 rejects a negative sortOrder', () => {
    expect(sOk(stage({ sortOrder: -1 }))).toBe(false);
  });
  it('TC-23 rejects a fractional sortOrder', () => {
    expect(sOk(stage({ sortOrder: 1.5 }))).toBe(false);
  });
  it('TC-24 stage update may be empty', () => {
    expect(UpdateStageRequest.safeParse({}).success).toBe(true);
  });
  it('TC-25 stage update can flip isTerminal', () => {
    expect(UpdateStageRequest.safeParse({ isTerminal: true }).success).toBe(true);
  });
});

describe('Workflow card · transition contract + role gating (FR-2)', () => {
  it('TC-26 a valid transition is accepted', () => {
    expect(tOk(transition())).toBe(true);
  });
  it('TC-27 Approve gated to GM is valid (the approver role)', () => {
    expect(tOk(transition({ allowedRole: 'GM', label: 'Approve' }))).toBe(true);
  });
  it('TC-28 Submit gated to ESTIMATOR is valid', () => {
    expect(
      tOk(
        transition({
          fromStageKey: 'DRAFT',
          toStageKey: 'IN_REVIEW',
          allowedRole: 'ESTIMATOR',
          label: 'Submit',
        }),
      ),
    ).toBe(true);
  });
  it('TC-29 Finalize gated to ADMIN is valid', () => {
    expect(tOk(transition({ allowedRole: 'ADMIN', label: 'Finalize' }))).toBe(true);
  });
  it('TC-30 a transition gated to VIEWER is structurally valid', () => {
    expect(tOk(transition({ allowedRole: 'VIEWER' }))).toBe(true);
  });
  it('TC-31 rejects an unknown allowedRole', () => {
    expect(tOk(transition({ allowedRole: 'MANAGER' }))).toBe(false);
  });
  it('TC-32 rejects a missing allowedRole', () => {
    const { allowedRole: _omit, ...rest } = transition();
    void _omit;
    expect(tOk(rest)).toBe(false);
  });
  it('TC-33 rejects an empty fromStageKey', () => {
    expect(tOk(transition({ fromStageKey: '' }))).toBe(false);
  });
  it('TC-34 rejects an empty toStageKey', () => {
    expect(tOk(transition({ toStageKey: '' }))).toBe(false);
  });
  it('TC-35 rejects an empty label', () => {
    expect(tOk(transition({ label: '' }))).toBe(false);
  });
  it('TC-36 rejects a label over 80 chars', () => {
    expect(tOk(transition({ label: 'l'.repeat(81) }))).toBe(false);
  });
  it('TC-37 accepts a description', () => {
    expect(tOk(transition({ description: 'sends it back for rework' }))).toBe(true);
  });
  it('TC-38 rejects a description over 500 chars', () => {
    expect(tOk(transition({ description: 'd'.repeat(501) }))).toBe(false);
  });
  it('TC-39 accepts requiresChecklistPass = true', () => {
    expect(tOk(transition({ requiresChecklistPass: true }))).toBe(true);
  });
  it('TC-40 accepts requiresChecklistPass = false', () => {
    expect(tOk(transition({ requiresChecklistPass: false }))).toBe(true);
  });
  it('TC-41 requiresChecklistPass is optional', () => {
    const parsed = CreateTransitionRequest.parse(transition());
    expect(parsed.requiresChecklistPass).toBeUndefined();
  });
  it('TC-42 transition update may change just the role to GM', () => {
    expect(UpdateTransitionRequest.safeParse({ allowedRole: 'GM' }).success).toBe(true);
  });
  it('TC-43 transition update may be empty', () => {
    expect(UpdateTransitionRequest.safeParse({}).success).toBe(true);
  });
  it('TC-44 transition update rejects an unknown role', () => {
    expect(UpdateTransitionRequest.safeParse({ allowedRole: 'BOSS' }).success).toBe(false);
  });
  it('TC-45 transition update can toggle requiresChecklistPass', () => {
    expect(UpdateTransitionRequest.safeParse({ requiresChecklistPass: false }).success).toBe(true);
  });
});

describe('Workflow card · per-estimate transition request', () => {
  it('TC-46 a transition request needs a target stage', () => {
    expect(TransitionRequest.safeParse({ toStageKey: 'APPROVED' }).success).toBe(true);
  });
  it('TC-47 rejects an empty target stage', () => {
    expect(TransitionRequest.safeParse({ toStageKey: '' }).success).toBe(false);
  });
  it('TC-48 accepts an optional note', () => {
    expect(
      TransitionRequest.safeParse({ toStageKey: 'DRAFT', note: 'please revise pricing' }).success,
    ).toBe(true);
  });
  it('TC-49 rejects a note over 2000 chars', () => {
    expect(
      TransitionRequest.safeParse({ toStageKey: 'DRAFT', note: 'n'.repeat(2001) }).success,
    ).toBe(false);
  });
  it('TC-50 accepts a note at exactly 2000 chars', () => {
    expect(
      TransitionRequest.safeParse({ toStageKey: 'DRAFT', note: 'n'.repeat(2000) }).success,
    ).toBe(true);
  });
  it('TC-51 the default workflow Approve→GM shape parses', () => {
    expect(
      tOk({
        fromStageKey: 'IN_REVIEW',
        toStageKey: 'APPROVED',
        allowedRole: 'GM',
        label: 'Approve',
        requiresChecklistPass: true,
      }),
    ).toBe(true);
  });
  it('TC-52 the default workflow Return-to-draft→GM shape parses', () => {
    expect(
      tOk({
        fromStageKey: 'IN_REVIEW',
        toStageKey: 'DRAFT',
        allowedRole: 'GM',
        label: 'Return to draft',
        requiresChecklistPass: false,
      }),
    ).toBe(true);
  });
});
