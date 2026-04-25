import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth.store';

export function useAuth() {
  const { setToken, setUser, logout } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: any) => api.auth.login(email, password),
    onSuccess: async (data: any) => {
      await setToken(data.token);
      setUser(data.user);
    },
  });

  const signupMutation = useMutation({
    mutationFn: (data: any) => api.auth.signup(data),
  });

  const userQuery = useQuery({
    queryKey: ['me'],
    queryFn: () => api.auth.me(),
    enabled: !!useAuthStore.getState().token,
  });

  return {
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    signup: signupMutation.mutateAsync,
    isSigningUp: signupMutation.isPending,
    user: userQuery.data,
    isLoadingUser: userQuery.isLoading,
    logout,
  };
}
