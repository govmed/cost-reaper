import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type {
  ChecklistResult,
  CloudPrice,
  EstimateDetail,
  EstimateSummary,
  EstimateWorkflow,
  Paginated,
  RateCard,
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
    transition: useMutation({ mutationFn: post('/transitions'), onSuccess }),
    delLabor: useMutation({ mutationFn: del('/labor-items'), onSuccess }),
    delNonLabor: useMutation({ mutationFn: del('/non-labor-items'), onSuccess }),
    delCloud: useMutation({ mutationFn: del('/cloud-items'), onSuccess }),
    delAssumption: useMutation({ mutationFn: del('/assumptions'), onSuccess }),
  };
}
