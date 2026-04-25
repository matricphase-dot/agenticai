import React from 'react';
import { ScrollView, View, Text, RefreshControl, Pressable } from 'react-native';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useStaking } from '../../hooks/useStaking';
import { useWalletBalance } from '../../hooks/useWalletBalance';
import { TrendingUp, Lock, RefreshCw, Zap } from 'lucide-react-native';

export default function StakingScreen() {
  const { positions, rewards, claim, isClaiming } = useStaking();
  const { data: wallet } = useWalletBalance();

  return (
    <ScrollView 
      className="flex-1 bg-bg"
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => {}} tintColor="#7C3AED" />}
    >
      <View className="p-6">
        <Card className="mb-8 border-purple/30 bg-purple/5">
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Claimable Yield</Text>
              <Text className="text-white text-4xl font-black">{rewards?.total || '0.00'} AGNT</Text>
            </View>
            <View className="w-12 h-12 rounded-full bg-purple/20 items-center justify-center">
              <TrendingUp size={24} color="#7C3AED" />
            </View>
          </View>
          <Button 
            title="Collect Rewards" 
            onPress={claim} 
            loading={isClaiming}
            className="w-full"
          />
        </Card>

        {wallet?.balance && (
          <Card className="mb-8 border-border/50 bg-card/30">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Connected Polygon Wallet</Text>
                <Badge label="Watch" variant="info" className="ml-2 scale-75" />
              </View>
              <RefreshCw size={12} color="#6B7280" />
            </View>
            <Text className="text-white text-lg font-bold">{wallet.balance} AGNT</Text>
          </Card>
        )}

        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-white text-xl font-bold">Active Commitments</Text>
          <Badge label={`${positions?.length || 0} Assets`} />
        </View>

        {positions?.length > 0 ? (
          positions.map((pos: any, i: number) => (
            <Card key={i} className="mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <View>
                  <Text className="text-white font-bold">{pos.agent?.name}</Text>
                  <Text className="text-gray-500 text-xs">Infrastructure Layer</Text>
                </View>
                <Badge label="STAKED" variant="success" />
              </View>

              <View className="flex-row justify-between pt-3 border-t border-border">
                <View>
                  <Text className="text-gray-500 text-[9px] font-bold uppercase tracking-widest">Amount</Text>
                  <Text className="text-white font-black">{pos.amount} AGNT</Text>
                </View>
                <View className="items-end">
                  <Text className="text-gray-500 text-[9px] font-bold uppercase tracking-widest">Locked Until</Text>
                  <View className="flex-row items-center">
                    <Lock size={10} color="#6B7280" className="mr-1" />
                    <Text className="text-white font-black">7 Days</Text>
                  </View>
                </View>
              </View>
            </Card>
          ))
        ) : (
          <View className="py-20 items-center justify-center border border-dashed border-border rounded-xl">
             <Text className="text-gray-500 mb-4">No active stakes found.</Text>
             <Button title="Explore Marketplace" onPress={() => {}} variant="secondary" size="sm" />
          </View>
        )}
      </View>
    </ScrollView>
  );
}
