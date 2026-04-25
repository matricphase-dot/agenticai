import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useGovernance(params: any = {}) {
  const queryClient = useQueryClient();

  const proposalsQuery = useQuery({
    queryKey: ['proposals', params],
    queryFn: () => api.governance.proposals(params),
  });

  const voteMutation = useMutation({
    mutationFn: ({ id, choice }: any) => api.governance.vote(id, choice),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['proposal', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    },
  });

  return {
    proposals: proposalsQuery.data,
    isLoading: proposalsQuery.isLoading,
    vote: voteMutation.mutateAsync,
    isVoting: voteMutation.isPending,
  };
}

export function useProposal(id: string) {
  return useQuery({
    queryKey: ['proposal', id],
    queryFn: () => api.governance.proposal(id),
    enabled: !!id,
  });
}
