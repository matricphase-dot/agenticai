import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useAgents(params: any = {}) {
  return useQuery({
    queryKey: ['agents', params],
    queryFn: () => api.marketplace.list(params),
  });
}

export function useAgent(id: string) {
  return useQuery({
    queryKey: ['agent', id],
    queryFn: () => api.marketplace.get(id),
    enabled: !!id,
  });
}
