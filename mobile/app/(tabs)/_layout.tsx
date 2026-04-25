import React from 'react';
import { Tabs } from 'expo-router';
import { Grid, ShoppingBag, TrendingUp, CheckSquare, User } from 'lucide-react-native';
import { View, Text } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      tabBarStyle: {
        backgroundColor: '#1A1A1A',
        borderTopWidth: 1,
        borderTopColor: '#2A2A2A',
        height: 60,
        paddingBottom: 8,
      },
      tabBarActiveTintColor: '#7C3AED',
      tabBarInactiveTintColor: '#6B7280',
      headerShown: true,
      headerStyle: {
        backgroundColor: '#0F0F0F',
        borderBottomWidth: 1,
        borderBottomColor: '#2A2A2A',
      },
      headerTitle: () => (
        <View className="flex-row items-center">
          <Text className="text-white text-lg font-black italic tracking-tighter">
            AGENTIC <Text className="text-purple not-italic">AI</Text>
          </Text>
        </View>
      ),
    }}>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Grid size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="marketplace" 
        options={{ 
          title: 'Marketplace',
          tabBarIcon: ({ color }) => <ShoppingBag size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="staking" 
        options={{ 
          title: 'Staking',
          tabBarIcon: ({ color }) => <TrendingUp size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="governance" 
        options={{ 
          title: 'DAO',
          tabBarIcon: ({ color }) => <CheckSquare size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={24} color={color} />
        }} 
      />
    </Tabs>
  );
}
