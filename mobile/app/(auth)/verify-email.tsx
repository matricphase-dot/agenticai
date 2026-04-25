import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Mail } from 'lucide-react-native';
import { Link } from 'expo-router';

export default function VerifyEmailScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg px-6 items-center justify-center">
      <View className="w-20 h-20 bg-purple/10 rounded-full items-center justify-center mb-6">
        <Mail size={40} color="#7C3AED" />
      </View>
      
      <Text className="text-white text-2xl font-bold mb-2">Check your email</Text>
      <Text className="text-gray-400 text-center mb-8">
        We've sent a verification link to your inbox. Tap the link to activate your account.
      </Text>

      <Button 
        title="Resend Email" 
        onPress={() => {}} 
        variant="secondary"
        className="w-full mb-4"
      />

      <Link href="/(auth)/login" asChild>
        <Text className="text-purple font-bold">Back to login</Text>
      </Link>
    </SafeAreaView>
  );
}
