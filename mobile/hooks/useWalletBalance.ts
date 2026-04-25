import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth.store';
import { getTokenBalance, getPendingOnChainRewards } from '../lib/web3';

export function useWalletBalance() {
  const { walletAddress } = useAuthStore();

  return useQuery({
    queryKey: ['wallet-balance', walletAddress],
    queryFn: async () => {
      if (!walletAddress) return { balance: '0.0', pendingRewards: '0.0' };
      const [balance, pendingRewards] = await Promise.all([
        getTokenBalance(walletAddress),
        getPendingOnChainRewards(walletAddress)
      ]);
      return { balance, pendingRewards };
    },
    enabled: !!walletAddress,
    refetchInterval: 30000,
  });
}
