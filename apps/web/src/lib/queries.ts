import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, uploadDocument } from './api';
import type {
  AuditEvent,
  Baseline,
  EstimateDocument,
  ChecklistResult,
  ChecklistRuleAdmin,
  ChecklistRuleSet,
  CloudPrice,
  DashboardStageEstimate,
  DashboardSummary,
  EstimateDetail,
  EstimateSummary,
  EstimateWorkflow,
  FxRate,
  Paginated,
  PermissionMeta,
  ProviderLastPulled,
  RateCard,
  RoleDto,
  ReferenceType,
  ReferenceValue,
  Scenario,
  SowEligibleEstimate,
  SowSummary,
  StatementOfWork,
  UserDto,
  WorkflowDefinition,
  WorkflowSummary,
} from './types';

export function useEstimates(params: { q?: string }) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  // Fetch a full page so the list card can sort + paginate client-side (FR-9).
  qs.set('pageSize', '200');
  return useQuery({
    queryKey: ['estimates', params],
    queryFn: () => api<Paginated<EstimateSummary>>(`/estimates?${qs.toString()}`),
  });
}

export function useEstimate(id: string | undefined) {
  return useQuery({
    queryKey: ['estimate', id],
    queryFn: () => api<EstimateDetail>(`/estimates/${id}`),
    enabled: Boolean(id),
  });
}

export function useRateCards() {
  return useQuery({ queryKey: ['rate-cards'], queryFn: () => api<RateCard[]>('/rate-cards') });
}

export function useCreateRateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) =>
      api<RateCard>('/rate-cards', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rate-cards'] }),
  });
}

export function useRateCardMutations() {
  const qc = useQueryClient();
  const onSuccess = () => qc.invalidateQueries({ queryKey: ['rate-cards'] });
  return {
    update: useMutation({
      mutationFn: (v: { id: string; body: unknown }) =>
        api(`/rate-cards/${v.id}`, { method: 'PATCH', body: JSON.stringify(v.body) }),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api(`/rate-cards/${id}`, { method: 'DELETE' }),
      onSuccess,
    }),
    addRole: useMutation({
      mutationFn: (v: { id: string; body: unknown }) =>
        api(`/rate-cards/${v.id}/roles`, { method: 'POST', body: JSON.stringify(v.body) }),
      onSuccess,
    }),
    updateRole: useMutation({
      mutationFn: (v: { id: string; roleId: string; body: unknown }) =>
        api(`/rate-cards/${v.id}/roles/${v.roleId}`, {
          method: 'PATCH',
          body: JSON.stringify(v.body),
        }),
      onSuccess,
    }),
    deleteRole: useMutation({
      mutationFn: (v: { id: string; roleId: string }) =>
        api(`/rate-cards/${v.id}/roles/${v.roleId}`, { method: 'DELETE' }),
      onSuccess,
    }),
  };
}

export function useWorkflow(id: string | undefined) {
  return useQuery({
    queryKey: ['workflow', id],
    queryFn: () => api<EstimateWorkflow>(`/estimates/${id}/workflow`),
    enabled: Boolean(id),
  });
}

// ── Workflow repo + authoring (FR-24, admin) ─────────────────────────────────

export function useWorkflows() {
  return useQuery({ queryKey: ['workflows'], queryFn: () => api<WorkflowSummary[]>('/workflows') });
}

export function useWorkflowRepoMutations() {
  const qc = useQueryClient();
  const onSuccess = () => void qc.invalidateQueries({ queryKey: ['workflows'] });
  return {
    create: useMutation({
      mutationFn: (body: { name: string; description?: string }) =>
        api('/workflows', { method: 'POST', body: JSON.stringify(body) }),
      onSuccess,
    }),
    update: useMutation({
      mutationFn: (v: {
        id: string;
        body: { name?: string; description?: string; isActive?: boolean };
      }) => api(`/workflows/${v.id}`, { method: 'PATCH', body: JSON.stringify(v.body) }),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api(`/workflows/${id}`, { method: 'DELETE' }),
      onSuccess,
    }),
  };
}

/** A workflow definition by ref ('default' or an id). */
export function useWorkflowDefinition(wf: string | undefined) {
  return useQuery({
    queryKey: ['workflow-def', wf],
    queryFn: () => api<WorkflowDefinition>(`/workflows/${wf}`),
    enabled: Boolean(wf),
  });
}

export interface StageInput {
  key?: string;
  label?: string;
  sortOrder?: number;
  isInitial?: boolean;
  isTerminal?: boolean;
}
export interface TransitionInput {
  fromStageKey?: string;
  toStageKey?: string;
  allowedRole?: string;
  label?: string;
  description?: string;
  requiresChecklistPass?: boolean;
}

/** Stage/transition authoring for a specific workflow ('default' or an id). */
export function useWorkflowAuthoring(wf: string) {
  const qc = useQueryClient();
  const onSuccess = () => void qc.invalidateQueries({ queryKey: ['workflow-def', wf] });
  const base = `/workflows/${wf}`;
  return {
    addStage: useMutation({
      mutationFn: (body: StageInput) =>
        api(`${base}/stages`, { method: 'POST', body: JSON.stringify(body) }),
      onSuccess,
    }),
    updateStage: useMutation({
      mutationFn: (v: { id: string; body: StageInput }) =>
        api(`${base}/stages/${v.id}`, { method: 'PATCH', body: JSON.stringify(v.body) }),
      onSuccess,
    }),
    deleteStage: useMutation({
      mutationFn: (id: string) => api(`${base}/stages/${id}`, { method: 'DELETE' }),
      onSuccess,
    }),
    addTransition: useMutation({
      mutationFn: (body: TransitionInput) =>
        api(`${base}/transitions`, { method: 'POST', body: JSON.stringify(body) }),
      onSuccess,
    }),
    updateTransition: useMutation({
      mutationFn: (v: { id: string; body: TransitionInput }) =>
        api(`${base}/transitions/${v.id}`, { method: 'PATCH', body: JSON.stringify(v.body) }),
      onSuccess,
    }),
    deleteTransition: useMutation({
      mutationFn: (id: string) => api(`${base}/transitions/${id}`, { method: 'DELETE' }),
      onSuccess,
    }),
  };
}

export function useChecklist(id: string | undefined) {
  return useQuery({
    queryKey: ['checklist', id],
    queryFn: () => api<ChecklistResult>(`/estimates/${id}/checklist`),
    enabled: Boolean(id),
  });
}

// ── Checklist rule sets (FR-25, admin) — a repo of named rule collections ─────

export function useChecklistRuleSets() {
  return useQuery({
    queryKey: ['checklist-rule-sets'],
    queryFn: () => api<ChecklistRuleSet[]>('/checklist-rule-sets'),
  });
}

export function useChecklistRuleSetMutations() {
  const qc = useQueryClient();
  const onSuccess = () => void qc.invalidateQueries({ queryKey: ['checklist-rule-sets'] });
  return {
    create: useMutation({
      mutationFn: (body: { name: string; description?: string }) =>
        api('/checklist-rule-sets', { method: 'POST', body: JSON.stringify(body) }),
      onSuccess,
    }),
    update: useMutation({
      mutationFn: (v: {
        id: string;
        body: { name?: string; description?: string; isActive?: boolean };
      }) => api(`/checklist-rule-sets/${v.id}`, { method: 'PATCH', body: JSON.stringify(v.body) }),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api(`/checklist-rule-sets/${id}`, { method: 'DELETE' }),
      onSuccess,
    }),
  };
}

// ── Checklist-rule authoring (FR-25, admin) ──────────────────────────────────

export function useChecklistRules(ruleSetId?: string) {
  const qs = ruleSetId ? `?ruleSetId=${encodeURIComponent(ruleSetId)}` : '';
  return useQuery({
    queryKey: ['checklist-rules', ruleSetId ?? 'all'],
    queryFn: () => api<ChecklistRuleAdmin[]>(`/checklist-rules${qs}`),
  });
}

export interface ChecklistRuleInput {
  key?: string;
  description?: string;
  severity?: string;
  scope?: string;
  isActive?: boolean;
  ruleSetId?: string;
}

export function useChecklistRuleMutations() {
  const qc = useQueryClient();
  const onSuccess = () => {
    void qc.invalidateQueries({ queryKey: ['checklist-rules'] });
    void qc.invalidateQueries({ queryKey: ['checklist-rule-sets'] });
    // Estimate checklists re-evaluate against the changed rule set.
    void qc.invalidateQueries({ queryKey: ['checklist'] });
  };
  return {
    create: useMutation({
      mutationFn: (body: ChecklistRuleInput) =>
        api('/checklist-rules', { method: 'POST', body: JSON.stringify(body) }),
      onSuccess,
    }),
    update: useMutation({
      mutationFn: (v: { id: string; body: ChecklistRuleInput }) =>
        api(`/checklist-rules/${v.id}`, { method: 'PATCH', body: JSON.stringify(v.body) }),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api(`/checklist-rules/${id}`, { method: 'DELETE' }),
      onSuccess,
    }),
  };
}

export function useCloudPrices() {
  return useQuery({
    queryKey: ['cloud-prices'],
    queryFn: () => api<CloudPrice[]>('/cloud-prices'),
  });
}

export function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: () => api<UserDto[]>('/users') });
}

// ── Estimate supporting documents (FR-29) ───────────────────────────────────
export function useEstimateDocuments(id: string | undefined) {
  return useQuery({
    queryKey: ['documents', id],
    queryFn: () => api<EstimateDocument[]>(`/estimates/${id}/documents`),
    enabled: !!id,
  });
}
export function useDocumentMutations(estimateId: string) {
  const qc = useQueryClient();
  const onSuccess = () => void qc.invalidateQueries({ queryKey: ['documents', estimateId] });
  return {
    upload: useMutation({
      mutationFn: (v: { file: File; documentType: string; description: string }) =>
        uploadDocument(estimateId, v.file, v.documentType, v.description),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (docId: string) =>
        api(`/estimates/${estimateId}/documents/${docId}`, { method: 'DELETE' }),
      onSuccess,
    }),
  };
}

// ── Audit trail (FR-11) — read-only ─────────────────────────────────────────
export function useAudit(params: {
  q?: string;
  entityType?: string;
  page: number;
  pageSize: number;
}) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.entityType) qs.set('entityType', params.entityType);
  qs.set('page', String(params.page));
  qs.set('pageSize', String(params.pageSize));
  return useQuery({
    queryKey: ['audit', params],
    queryFn: () => api<Paginated<AuditEvent>>(`/audit?${qs.toString()}`),
  });
}
export function useAuditEntityTypes() {
  return useQuery({
    queryKey: ['audit-entity-types'],
    queryFn: () => api<string[]>('/audit/entity-types'),
    staleTime: 5 * 60 * 1000,
  });
}

// ── Roles & permissions (FR-30) ─────────────────────────────────────────────
export function useRoles() {
  return useQuery({ queryKey: ['roles'], queryFn: () => api<RoleDto[]>('/roles') });
}
export function usePermissionCatalog() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: () => api<PermissionMeta[]>('/permissions'),
    staleTime: 5 * 60 * 1000,
  });
}
export function useRoleMutations() {
  const qc = useQueryClient();
  const onSuccess = () => {
    void qc.invalidateQueries({ queryKey: ['roles'] });
    void qc.invalidateQueries({ queryKey: ['users'] });
  };
  return {
    create: useMutation({
      mutationFn: (body: unknown) => api('/roles', { method: 'POST', body: JSON.stringify(body) }),
      onSuccess,
    }),
    update: useMutation({
      mutationFn: (v: { id: string; body: unknown }) =>
        api(`/roles/${v.id}`, { method: 'PATCH', body: JSON.stringify(v.body) }),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api(`/roles/${id}`, { method: 'DELETE' }),
      onSuccess,
    }),
  };
}

export function useUserMutations() {
  const qc = useQueryClient();
  const onSuccess = () => qc.invalidateQueries({ queryKey: ['users'] });
  return {
    create: useMutation({
      mutationFn: (body: unknown) => api('/users', { method: 'POST', body: JSON.stringify(body) }),
      onSuccess,
    }),
    update: useMutation({
      mutationFn: (v: { id: string; body: unknown }) =>
        api(`/users/${v.id}`, { method: 'PATCH', body: JSON.stringify(v.body) }),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api(`/users/${id}`, { method: 'DELETE' }),
      onSuccess,
    }),
  };
}

export function useCreateEstimate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) =>
      api<EstimateDetail>('/estimates', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['estimates'] }),
  });
}

/** Bundle of mutations for one estimate; all invalidate the detail + list on success. */
export function useEstimateMutations(id: string) {
  const qc = useQueryClient();
  const onSuccess = () => {
    void qc.invalidateQueries({ queryKey: ['estimate', id] });
    void qc.invalidateQueries({ queryKey: ['estimates'] });
    void qc.invalidateQueries({ queryKey: ['workflow', id] });
    void qc.invalidateQueries({ queryKey: ['checklist', id] });
    void qc.invalidateQueries({ queryKey: ['scenarios', id] });
    void qc.invalidateQueries({ queryKey: ['baselines', id] });
  };
  const post = (path: string) => (body: unknown) =>
    api(`/estimates/${id}${path}`, { method: 'POST', body: JSON.stringify(body) });
  const del = (path: string) => (itemId: string) =>
    api(`/estimates/${id}${path}/${itemId}`, { method: 'DELETE' });

  return {
    patch: useMutation({
      mutationFn: (body: unknown) =>
        api(`/estimates/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
      onSuccess,
    }),
    addLabor: useMutation({ mutationFn: post('/labor-items'), onSuccess }),
    addNonLabor: useMutation({ mutationFn: post('/non-labor-items'), onSuccess }),
    addCloud: useMutation({ mutationFn: post('/cloud-items'), onSuccess }),
    addAssumption: useMutation({ mutationFn: post('/assumptions'), onSuccess }),
    addComment: useMutation({ mutationFn: post('/comments'), onSuccess }),
    createScenario: useMutation({
      mutationFn: () => api(`/estimates/${id}/scenarios`, { method: 'POST' }),
      onSuccess,
    }),
    captureBaseline: useMutation({ mutationFn: post('/baselines'), onSuccess }),
    delBaseline: useMutation({ mutationFn: del('/baselines'), onSuccess }),
    transition: useMutation({ mutationFn: post('/transitions'), onSuccess }),
    delLabor: useMutation({ mutationFn: del('/labor-items'), onSuccess }),
    delNonLabor: useMutation({ mutationFn: del('/non-labor-items'), onSuccess }),
    delCloud: useMutation({ mutationFn: del('/cloud-items'), onSuccess }),
    delAssumption: useMutation({ mutationFn: del('/assumptions'), onSuccess }),
    delComment: useMutation({ mutationFn: del('/comments'), onSuccess }),
  };
}

// ── Reference data (FR-29) ────────────────────────────────────────────────────
export function useReferenceTypes() {
  return useQuery({
    queryKey: ['reference-types'],
    queryFn: () => api<ReferenceType[]>('/reference/types'),
  });
}

export function useReferenceValues(typeCode: string | undefined, includeInactive = false) {
  return useQuery({
    queryKey: ['reference-values', typeCode, includeInactive],
    queryFn: () =>
      api<ReferenceValue[]>(
        `/reference/types/${typeCode}/values${includeInactive ? '?all=true' : ''}`,
      ),
    enabled: Boolean(typeCode),
  });
}

export function useReferenceMutations(typeCode: string | undefined) {
  const qc = useQueryClient();
  const onSuccess = () => qc.invalidateQueries({ queryKey: ['reference-values', typeCode] });
  return {
    createValue: useMutation({
      mutationFn: (body: unknown) =>
        api(`/reference/types/${typeCode}/values`, { method: 'POST', body: JSON.stringify(body) }),
      onSuccess,
    }),
    updateValue: useMutation({
      mutationFn: (v: { id: string; body: unknown }) =>
        api(`/reference/values/${v.id}`, { method: 'PATCH', body: JSON.stringify(v.body) }),
      onSuccess,
    }),
    deleteValue: useMutation({
      mutationFn: (id: string) => api(`/reference/values/${id}`, { method: 'DELETE' }),
      onSuccess,
    }),
  };
}

// ── Dashboard (FR-18) ─────────────────────────────────────────────────────────
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api<DashboardSummary>('/dashboard'),
  });
}

/** Drill-down: the estimates in a given workflow stage (null = not open). */
export function useStageEstimates(stageKey: string | null) {
  return useQuery({
    queryKey: ['dashboard-stage', stageKey],
    queryFn: () => api<DashboardStageEstimate[]>(`/dashboard/stage/${stageKey}`),
    enabled: Boolean(stageKey),
  });
}

// ── Scenarios (FR-14) ─────────────────────────────────────────────────────────
export function useScenarios(id: string | undefined) {
  return useQuery({
    queryKey: ['scenarios', id],
    queryFn: () => api<Scenario[]>(`/estimates/${id}/scenarios`),
    enabled: Boolean(id),
  });
}

// ── Baselines / versioning (FR-15) ────────────────────────────────────────────
export function useBaselines(id: string | undefined) {
  return useQuery({
    queryKey: ['baselines', id],
    queryFn: () => api<Baseline[]>(`/estimates/${id}/baselines`),
    enabled: Boolean(id),
  });
}

// ── Cloud price freshness + refresh (FR-21a/b) ────────────────────────────────
export function useLastPulled() {
  return useQuery({
    queryKey: ['cloud-last-pulled'],
    queryFn: () => api<ProviderLastPulled[]>('/cloud-prices/last-pulled'),
  });
}

export function useCloudSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { provider?: string }) =>
      api('/cloud-prices/sync', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['cloud-last-pulled'] });
      void qc.invalidateQueries({ queryKey: ['cloud-prices'] });
    },
  });
}

// ── FX rates (FR-17) ──────────────────────────────────────────────────────────
export function useFxRates() {
  return useQuery({ queryKey: ['fx-rates'], queryFn: () => api<FxRate[]>('/fx-rates') });
}

export function useFxMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { currency: string; rateToBase: string }) =>
      api(`/fx-rates/${v.currency}`, {
        method: 'PATCH',
        body: JSON.stringify({ rateToBase: v.rateToBase }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['fx-rates'] });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useFxRefresh() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api('/fx-rates/refresh', { method: 'POST' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['fx-rates'] });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ── Statement of Work (BR-7) ─────────────────────────────────────────────────

export function useSows() {
  return useQuery({ queryKey: ['sow'], queryFn: () => api<SowSummary[]>('/sow') });
}

/** Estimates eligible to be a SOW source (approved/final workflow stage). */
export function useEligibleEstimates() {
  return useQuery({
    queryKey: ['sow-eligible-estimates'],
    queryFn: () => api<SowEligibleEstimate[]>('/sow/eligible-estimates'),
  });
}

export function useSow(id: string | undefined) {
  return useQuery({
    queryKey: ['sow', id],
    queryFn: () => api<StatementOfWork>(`/sow/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateSow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      estimateId: string;
      title?: string;
      clientName?: string;
      flavor?: string;
    }) => api<StatementOfWork>('/sow', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['sow'] }),
  });
}

export function useSowMutations(id: string) {
  const qc = useQueryClient();
  const onSuccess = () => {
    void qc.invalidateQueries({ queryKey: ['sow', id] });
    void qc.invalidateQueries({ queryKey: ['sow'] });
  };
  return {
    update: useMutation({
      mutationFn: (body: Record<string, unknown>) =>
        api(`/sow/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
      onSuccess,
    }),
    issue: useMutation({
      mutationFn: () => api(`/sow/${id}/issue`, { method: 'POST' }),
      onSuccess,
    }),
    revert: useMutation({
      mutationFn: () => api(`/sow/${id}/revert`, { method: 'POST' }),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: () => api(`/sow/${id}`, { method: 'DELETE' }),
      onSuccess: () => void qc.invalidateQueries({ queryKey: ['sow'] }),
    }),
  };
}

// ── App settings (admin-configurable) ────────────────────────────────────────
export function useDocumentUploadLimit() {
  return useQuery({
    queryKey: ['settings', 'doc-upload-limit'],
    queryFn: () => api<{ maxUploadMb: number }>('/settings/document-upload-limit'),
  });
}

export function useUpdateDocumentUploadLimit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (maxUploadMb: number) =>
      api<{ maxUploadMb: number }>('/settings/document-upload-limit', {
        method: 'PUT',
        body: JSON.stringify({ maxUploadMb }),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['settings'] }),
  });
}
