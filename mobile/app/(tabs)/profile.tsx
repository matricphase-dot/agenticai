import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/auth.store';
import { truncateAddress } from '../../lib/utils';
import { Settings, Shield, Bell, Key, LogOut, Copy, ExternalLink } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, walletAddress, setWalletAddress, logout } = useAuthStore();
  const [addressInput, setAddressInput] = useState(walletAddress || '');

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to terminate this session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-bg">
      <View className="p-6">
        <View className="items-center mb-10">
          <Image 
            source={{ uri: user?.avatar || 'https://github.com/shadcn.png' }}
            className="w-24 h-24 rounded-full border-4 border-card mb-4"
          />
          <Text className="text-white text-2xl font-black">{user?.name || 'Operator'}</Text>
          <Text className="text-gray-500 font-medium">{user?.email}</Text>
        </View>

        <Card className="mb-8 p-6">
          <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-4">Wallet Monitoring</Text>
          <Input 
            placeholder="0x... (Ethereum Address)"
            value={addressInput}
            onChangeText={setAddressInput}
            className="mb-4"
          />
          <Button 
            title="Update Watchlist" 
            onPress={() => setWalletAddress(addressInput)} 
            className="w-full"
          />
          <Text className="text-gray-600 text-[10px] text-center mt-3 font-bold uppercase tracking-widest underline italic">Full WalletConnect integration in v1.1</Text>
        </Card>

        <View className="space-y-4">
          <Pressable className="bg-card border border-border p-4 rounded-xl flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-info/10 rounded-lg items-center justify-center mr-4">
                 <Bell size={20} color="#3B82F6" />
              </View>
              <Text className="text-white font-bold">Alert Preferences</Text>
            </View>
            <ExternalLink size={16} color="#6B7280" />
          </Pressable>

          <Pressable className="bg-card border border-border p-4 rounded-xl flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-purple/10 rounded-lg items-center justify-center mr-4">
                 <Key size={20} color="#7C3AED" />
              </View>
              <Text className="text-white font-bold">API Access Vault</Text>
            </View>
            <ExternalLink size={16} color="#6B7280" />
          </Pressable>

          <Pressable className="bg-card border border-border p-4 rounded-xl flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-warning/10 rounded-lg items-center justify-center mr-4">
                 <Shield size={20} color="#F59E0B" />
              </View>
              <Text className="text-white font-bold">Security Settings</Text>
            </View>
            <ExternalLink size={16} color="#6B7280" />
          </Pressable>
        </View>

        <Button 
          title="Sign Out" 
          onPress={handleLogout} 
          variant="ghost" 
          className="mt-12"
          leftIcon={<LogOut size={20} color="#EF4444" />}
        />
        <Text className="text-gray-600 text-center text-[10px] uppercase font-bold tracking-widest mt-4">Agentic AI v1.0.0-alpha</Text>
      </View>
    </ScrollView>
  );
}
