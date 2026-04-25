import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';
import { router, Link } from 'expo-router';
import Toast from 'react-native-toast-message';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signup, isSigningUp } = useAuth();

  const handleSignup = async () => {
    try {
      await signup({ name, email, password });
      Toast.show({ type: 'success', text1: 'Account Created', text2: 'Please verify your email.' });
      router.push('/(auth)/verify-email');
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Signup Failed', text2: e.response?.data?.error });
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
              JOIN THE <Text className="text-purple not-italic">FLEET</Text>
            </Text>
            <Text className="text-gray-400 font-medium mt-2">Create your decentralized AI identity.</Text>
          </View>

          <View className="space-y-6">
            <Input 
              label="Full Name"
              placeholder="John Doe"
              value={name}
              onChangeText={setName}
            />
            <Input 
              label="Email"
              placeholder="j.doe@example.com"
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
              title="Create Identity"
              onPress={handleSignup}
              loading={isSigningUp}
              className="mt-4"
            />
          </View>

          <View className="mt-8 flex-row justify-center">
            <Text className="text-gray-500">Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <Text className="text-purple font-bold">Log in</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
