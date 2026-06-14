import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type {
  Baseline,
  ChecklistResult,
  CloudPrice,
  DashboardSummary,
  EstimateDetail,
  EstimateSummary,
  EstimateWorkflow,
  FxRate,
  Paginated,
  ProviderLastPulled,
  RateCard,
  ReferenceType,
  ReferenceValue,
  Scenario,
  UserDto,
} from './types';

export function useEstimates(params: { q?: string; status?: string }) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.status) qs.set('status', params.status);
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

export function useChecklist(id: string | undefined) {
  return useQuery({
    queryKey: ['checklist', id],
    queryFn: () => api<ChecklistResult>(`/estimates/${id}/checklist`),
    enabled: Boolean(id),
  });
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
