import React from 'react';
import { ScrollView, View, Text, RefreshControl, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuthStore } from '../../store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { TrendingUp, Cpu, Wallet, Zap, ArrowUpRight } from 'lucide-react-native';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const { data: balance, isLoading: isBalLoading, refetch: refetchBal } = useQuery({
    queryKey: ['balance'],
    queryFn: () => api.billing.balance()
  });

  const { data: recentInvocations, refetch: refetchLogs } = useQuery({
    queryKey: ['recent-invocations'],
    queryFn: () => api.notifications.list() // Using notifications as proxy for feed
  });

  const onRefresh = () => {
    refetchBal();
    refetchLogs();
  };

  const metrics = [
    { label: 'Agents', value: '12', icon: <Cpu size={16} color="#7C3AED" /> },
    { label: 'Yield', value: '14.2%', icon: <TrendingUp size={16} color="#10B981" /> },
    { label: 'Spent', value: '$240', icon: <Wallet size={16} color="#3B82F6" /> },
    { label: 'Calls', value: '1.2k', icon: <Zap size={16} color="#F59E0B" /> }
  ];

  return (
    <ScrollView 
      className="flex-1 bg-bg"
      refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor="#7C3AED" />}
    >
      <View className="p-6">
        <View className="mb-8">
          <Text className="text-gray-400 font-medium">Welcome back,</Text>
          <Text className="text-white text-3xl font-black">{user?.name || 'Operator'}</Text>
        </View>

        <Card className="mb-8 bg-purple/10 border-purple/20">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-purple font-black uppercase tracking-widest text-[10px]">Total Credits</Text>
            <Zap size={14} color="#7C3AED" />
          </View>
          <Text className="text-white text-4xl font-black">${balance?.credits?.toFixed(2) || '0.00'}</Text>
          <Text className="text-gray-500 text-xs mt-1">Available for agent invocations</Text>
        </Card>

        <View className="flex-row flex-wrap justify-between mb-8">
          {metrics.map((m, i) => (
            <Card key={i} className="w-[48%] mb-4 p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-gray-500 font-bold uppercase text-[9px] tracking-widest">{m.label}</Text>
                {m.icon}
              </View>
              <Text className="text-white text-xl font-black">{m.value}</Text>
            </Card>
          ))}
        </View>

        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-white text-xl font-bold">Recent Alerts</Text>
          <Text className="text-purple font-bold text-xs">View All</Text>
        </View>

        {recentInvocations?.length > 0 ? (
          recentInvocations.slice(0, 5).map((log: any, i: number) => (
            <View key={i} className="flex-row items-center justify-between py-4 border-b border-border">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-card border border-border items-center justify-center mr-3">
                  <Zap size={18} color="#7C3AED" />
                </View>
                <View>
                  <Text className="text-white font-bold">{log.title}</Text>
                  <Text className="text-gray-500 text-xs">{new Date(log.createdAt).toLocaleTimeString()}</Text>
                </View>
              </View>
              <Badge label="INFO" variant="info" />
            </View>
          ))
        ) : (
          <View className="py-8 items-center justify-center border border-dashed border-border rounded-xl">
            <Text className="text-gray-500">No recent activity detected.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
