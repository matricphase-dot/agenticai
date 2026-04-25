import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useProposal } from '../../hooks/useGovernance';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ChevronLeft, Info, CheckCircle2, XCircle, MinusCircle } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

export default function ProposalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: prop, isLoading } = useProposal(id);

  if (isLoading) return <View className="flex-1 bg-bg items-center justify-center"><Text className="text-gray-500">Querying DAO...</Text></View>;

  return (
    <ScrollView className="flex-1 bg-bg">
      <View className="p-6 pt-12">
        <Pressable onPress={() => router.back()} className="mb-6">
          <ChevronLeft size={24} color="white" />
        </Pressable>

        <View className="flex-row items-center justify-between mb-4">
          <Badge label={prop?.proposalType || 'DAO'} />
          <Badge label="ACTIVE" variant="success" />
        </View>

        <Text className="text-white text-3xl font-black mb-4">{prop?.title}</Text>
        
        <View className="flex-row items-center mb-8">
          <View className="w-8 h-8 rounded-full bg-card border border-border items-center justify-center mr-3">
             <Text className="text-[10px] text-gray-500 font-bold">DAO</Text>
          </View>
          <Text className="text-gray-500">Proposed by <Text className="text-white font-bold">{prop?.proposer || 'Ecosystem Treasury'}</Text></Text>
        </View>

        <Text className="text-white text-xl font-bold mb-4">Summary</Text>
        <Text className="text-gray-400 leading-relaxed mb-8 text-sm">
          {prop?.description || "This proposal aims to reallocate protocol yield to infrastructure providers to ensure long-term sustainability of the decentralized agent fleet."}
        </Text>

        <View className="space-y-4 mb-10">
          <Card className="flex-row items-center justify-between border-success/30 bg-success/5">
             <View className="flex-row items-center">
                <CheckCircle2 color="#10B981" size={20} />
                <Text className="text-white font-bold ml-3">Approve</Text>
             </View>
             <Text className="text-success font-black">72.4%</Text>
          </Card>
          <Card className="flex-row items-center justify-between border-error/30 bg-error/5">
             <View className="flex-row items-center">
                <XCircle color="#EF4444" size={20} />
                <Text className="text-white font-bold ml-3">Reject</Text>
             </View>
             <Text className="text-error font-black">20.1%</Text>
          </Card>
          <Card className="flex-row items-center justify-between border-gray-500/30 bg-gray-500/5">
             <View className="flex-row items-center">
                <MinusCircle color="#6B7280" size={20} />
                <Text className="text-white font-bold ml-3">Abstain</Text>
             </View>
             <Text className="text-gray-500 font-black">7.5%</Text>
          </Card>
        </View>

        <View className="p-4 bg-card border border-border rounded-xl">
           <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest text-center mb-4">Cast Your Vote</Text>
           <View className="flex-row gap-2">
              <Button title="YES" onPress={() => Toast.show({ type: 'success', text1: 'Vote Recorded' })} className="flex-1" />
              <Button title="NO" onPress={() => {}} variant="danger" className="flex-1" />
           </View>
        </View>
      </View>
    </ScrollView>
  );
}
