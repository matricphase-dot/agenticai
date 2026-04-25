import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';
import { router, Link } from 'expo-router';
import Toast from 'react-native-toast-message';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoggingIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({ type: 'error', text1: 'Missing credentials' });
      return;
    }
    try {
      await login({ email, password });
      router.replace('/(tabs)');
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Login Failed', text2: e.response?.data?.error || 'Invalid email or password' });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 py-12">
          <View className="mb-12">
            <Text className="text-white text-4xl font-black italic tracking-tighter">
              AGENTIC <Text className="text-purple not-italic">AI</Text>
            </Text>
            <Text className="text-gray-400 font-medium mt-2">The AI Agent Infrastructure Layer.</Text>
          </View>

          <View className="space-y-6">
            <Input 
              label="Email Address"
              placeholder="operator@agenticai.dev"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <Input 
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            
            <Button 
              title="Initialize Session"
              onPress={handleLogin}
              loading={isLoggingIn}
              className="mt-4"
            />
          </View>

          <View className="mt-8 flex-row justify-center">
            <Text className="text-gray-500">Need an account? </Text>
            <Link href="/(auth)/signup" asChild>
              <Text className="text-purple font-bold">Sign up</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
