import React from 'react';
import { ScrollView, View, Text, RefreshControl } from 'react-native';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useGovernance } from '../../hooks/useGovernance';
import { Clock, MessageSquare, ChevronRight } from 'lucide-react-native';

export default function GovernanceScreen() {
  const { proposals, isLoading } = useGovernance();

  return (
    <ScrollView 
      className="flex-1 bg-bg"
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => {}} tintColor="#7C3AED" />}
    >
      <View className="p-6">
        <View className="mb-8">
          <Text className="text-gray-400 font-medium">Protocol DAO</Text>
          <Text className="text-white text-3xl font-black">Governance</Text>
        </View>

        <View className="flex-row mb-8">
          <View className="flex-1 bg-card border border-border p-4 rounded-xl mr-2">
            <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Voting Power</Text>
            <Text className="text-white text-xl font-black">1.2M AGNT</Text>
          </View>
          <View className="flex-1 bg-card border border-border p-4 rounded-xl ml-2">
            <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Proposals</Text>
            <Text className="text-white text-xl font-black">{proposals?.length || 0} Active</Text>
          </View>
        </View>

        <Text className="text-white text-xl font-bold mb-4">Active Proposals</Text>

        {proposals?.length > 0 ? (
          proposals.map((prop: any, i: number) => (
            <Card key={i} className="mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <Badge label={prop.proposalType} variant="purple" />
                <View className="flex-row items-center">
                  <Clock size={12} color="#10B981" />
                  <Text className="text-success text-xs font-bold ml-1">Active</Text>
                </View>
              </View>

              <Text className="text-white font-bold text-lg mb-2">{prop.title}</Text>
              
              <View className="h-2 bg-bg rounded-full overflow-hidden flex-row mb-4">
                <View className="h-full bg-success" style={{ width: '72%' }} />
                <View className="h-full bg-error" style={{ width: '20%' }} />
                <View className="h-full bg-gray-500" style={{ width: '8%' }} />
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <MessageSquare size={14} color="#6B7280" />
                  <Text className="text-gray-500 text-xs ml-1">12 Comments</Text>
                </View>
                <View className="flex-row items-center">
                   <Text className="text-purple font-bold text-xs mr-1">Vote Now</Text>
                   <ChevronRight size={14} color="#7C3AED" />
                </View>
              </View>
            </Card>
          ))
        ) : (
          <View className="py-20 items-center justify-center">
             <Text className="text-gray-500">No active proposals in current epoch.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
