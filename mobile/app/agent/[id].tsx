import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAgent } from '../../hooks/useAgents';
import { Image } from 'expo-image';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Star, ChevronLeft, Share2, Zap, Play, Terminal, Info } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { api } from '../../lib/api';

export default function AgentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: agent, isLoading } = useAgent(id);
  const [invoking, setInvoking] = useState(false);
  const [invocationResult, setInvocationResult] = useState<any>(null);

  const handleInvoke = async () => {
    setInvoking(true);
    try {
      const res = await api.invoke.run(id, { test: true }, 'dummy-key');
      setInvocationResult(res);
      Toast.show({ type: 'success', text1: 'Invocation Success' });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Invocation Failed', text2: e.message });
    } finally {
      setInvoking(false);
    }
  };

  if (isLoading) return <View className="flex-1 bg-bg items-center justify-center"><Text className="text-gray-500 font-bold uppercase tracking-widest">Protocol Syncing...</Text></View>;

  return (
    <ScrollView className="flex-1 bg-bg">
      <View className="relative h-64">
        <Image 
          source={{ uri: agent?.imageUrl || 'https://images.unsplash.com/photo-1677442136019-21780ecad995' }}
          className="w-full h-full opacity-60"
        />
        <View className="absolute top-12 left-6 right-6 flex-row justify-between">
          <Pressable onPress={() => router.back()} className="w-10 h-10 bg-bg/50 rounded-full items-center justify-center">
            <ChevronLeft size={24} color="white" />
          </Pressable>
          <Pressable className="w-10 h-10 bg-bg/50 rounded-full items-center justify-center">
            <Share2 size={20} color="white" />
          </Pressable>
        </View>
        <View className="absolute bottom-6 left-6">
          <Badge label={agent?.category} className="mb-2" />
          <Text className="text-white text-3xl font-black">{agent?.name}</Text>
        </View>
      </View>

      <View className="p-6">
        <View className="flex-row items-center mb-6">
          <Image source={{ uri: 'https://github.com/shadcn.png' }} className="w-8 h-8 rounded-full mr-3" />
          <Text className="text-gray-400">Created by <Text className="text-white font-bold">{agent?.creator?.name || 'Protocol Labs'}</Text></Text>
        </View>

        <View className="flex-row justify-between mb-8">
          <View className="items-center px-4 py-2 bg-card rounded-xl border border-border flex-1 mx-1">
             <Text className="text-gray-500 text-[9px] font-black uppercase mb-1">Success Rate</Text>
             <Text className="text-success font-black">99.2%</Text>
          </View>
          <View className="items-center px-4 py-2 bg-card rounded-xl border border-border flex-1 mx-1">
             <Text className="text-gray-500 text-[9px] font-black uppercase mb-1">Avg Latency</Text>
             <Text className="text-white font-black">124ms</Text>
          </View>
          <View className="items-center px-4 py-2 bg-card rounded-xl border border-border flex-1 mx-1">
             <Text className="text-gray-500 text-[9px] font-black uppercase mb-1">Invocations</Text>
             <Text className="text-purple font-black">14.2k</Text>
          </View>
        </View>

        <Text className="text-white text-xl font-bold mb-3">Capabilities</Text>
        <Text className="text-gray-400 leading-relaxed mb-8">
          {agent?.description || "This agent provides specialized infrastructure layers for processing decentralized data streams with high-fidelity outputs."}
        </Text>

        <Card className="mb-8 border-purple/30 bg-purple/5">
          <View className="flex-row justify-between mb-4">
            <View>
              <Text className="text-white font-bold text-lg">Infrastructure Cost</Text>
              <Text className="text-gray-500 text-xs text-purple">{agent?.price || 0} Credits / Invoc</Text>
            </View>
            <Zap size={24} color="#7C3AED" />
          </View>
          <Button 
            title="Invoke Sandbox" 
            onPress={handleInvoke} 
            loading={invoking}
            leftIcon={<Play size={18} color="white" />}
          />
        </Card>

        {invocationResult && (
          <Card className="mb-8 bg-black border-border border">
            <View className="flex-row items-center mb-3">
              <Terminal size={14} color="#10B981" />
              <Text className="text-success font-bold text-[10px] uppercase ml-2 tracking-widest">Process Output</Text>
            </View>
            <Text className="text-gray-300 font-mono text-xs">
              {JSON.stringify(invocationResult, null, 2)}
            </Text>
          </Card>
        )}

        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-white text-xl font-bold">Staking Rewards</Text>
          <Info size={18} color="#6B7280" />
        </View>
        <Card className="mb-8">
          <Text className="text-gray-400 text-sm mb-4">Stake AGNT on this agent to secure its compute nodes and earn 30% of its revenue share.</Text>
          <Button 
            title={`Stake on ${agent?.name}`} 
            onPress={() => router.push(`/stake/${id}`)} 
            variant="secondary" 
          />
        </Card>
      </View>
    </ScrollView>
  );
}
