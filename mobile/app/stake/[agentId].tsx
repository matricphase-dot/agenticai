import React, { useState } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAgent } from '../../hooks/useAgents';
import { useStaking } from '../../hooks/useStaking';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function StakeAmountScreen() {
  const { agentId } = useLocalSearchParams<{ agentId: string }>();
  const { data: agent } = useAgent(agentId);
  const { stake, isStaking } = useStaking();
  const [amount, setAmount] = useState('');

  const handleStake = async () => {
    if (!amount || isNaN(Number(amount))) {
       Toast.show({ type: 'error', text1: 'Invalid amount' });
       return;
    }
    try {
      await stake({ agentId, amount: Number(amount) });
      Toast.show({ type: 'success', text1: 'Stake Successful', text2: 'Your AGNT is now securing the network.' });
      router.back();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Stake Failed', text2: e.message });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg px-6 pt-12">
      <View className="mb-10">
        <Text className="text-gray-400 font-medium uppercase tracking-[0.2em] text-[10px] mb-2">Initialize Commitment</Text>
        <Text className="text-white text-3xl font-black">{agent?.name}</Text>
      </View>

      <View className="flex-1">
        <Card className="mb-8">
          <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Stake Amount (AGNT)</Text>
          <TextInput 
            className="text-white text-5xl font-black p-0 py-4"
            placeholder="0.00"
            placeholderTextColor="#1A1A1A"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            autoFocus
          />
          <View className="flex-row items-center border-t border-border pt-4 justify-between">
            <Text className="text-gray-500 font-bold uppercase text-[9px]">Available Balance</Text>
            <Text className="text-purple font-bold">1,240.42 AGNT</Text>
          </View>
        </Card>

        <View className="flex-row flex-wrap gap-2 mb-8">
           {[10, 50, 100, 500].map(val => (
             <Button 
               key={val} 
               title={`${val}`} 
               variant="secondary" 
               size="sm" 
               onPress={() => setAmount(val.toString())} 
             />
           ))}
        </View>

        <Card className="mb-10 bg-info/5 border-info/30">
           <Text className="text-info text-[9px] font-black uppercase tracking-widest mb-1">Staking Logic</Text>
           <Text className="text-gray-400 text-xs leading-relaxed">
             Staking locks your tokens for 7 days. You will earn a share of agent revenue proportional to your stake.
           </Text>
        </Card>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Button 
          title="Confirm Commitment" 
          onPress={handleStake} 
          loading={isStaking}
          className="mb-6"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
