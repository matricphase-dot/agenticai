import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useStaking() {
  const queryClient = useQueryClient();

  const positionsQuery = useQuery({
    queryKey: ['staking-positions'],
    queryFn: () => api.staking.positions(),
  });

  const rewardsQuery = useQuery({
    queryKey: ['staking-rewards'],
    queryFn: () => api.staking.rewards(),
  });

  const stakeMutation = useMutation({
    mutationFn: ({ agentId, amount }: any) => api.staking.stake(agentId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staking-positions'] });
    },
  });

  const claimMutation = useMutation({
    mutationFn: () => api.staking.claim(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staking-rewards'] });
    },
  });

  return {
    positions: positionsQuery.data,
    isLoadingPositions: positionsQuery.isLoading,
    rewards: rewardsQuery.data,
    stake: stakeMutation.mutateAsync,
    isStaking: stakeMutation.isPending,
    claim: claimMutation.mutateAsync,
    isClaiming: claimMutation.isPending,
  };
}
