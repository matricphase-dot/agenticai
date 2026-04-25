import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ScrollView } from 'react-native';
import { AgentCard } from '../../components/AgentCard';
import { useAgents } from '../../hooks/useAgents';
import { Search, Filter as FilterIcon } from 'lucide-react-native';

const CATEGORIES = ['All', 'Chatbot', 'Data Analyst', 'Code Assistant', 'Automation', 'Finance'];

export default function MarketplaceScreen() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const { data: agents, isLoading, refetch } = useAgents({ 
    search, 
    category: category === 'All' ? undefined : category 
  });

  return (
    <View className="flex-1 bg-bg">
      <View className="p-6 pb-2">
        <View className="flex-row items-center bg-card border border-border rounded-xl px-4 py-3 mb-6">
          <Search size={20} color="#6B7280" />
          <TextInput 
            placeholder="Search agents..." 
            placeholderTextColor="#6B7280"
            className="flex-1 ml-3 text-white font-medium"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="flex-row mb-4"
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full mr-2 border ${
                category === cat ? 'bg-purple border-purple' : 'bg-card border-border'
              }`}
            >
              <Text className={`font-bold text-xs ${category === cat ? 'text-white' : 'text-gray-400'}`}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList 
        data={agents}
        renderItem={({ item }) => <AgentCard agent={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24, paddingTop: 0 }}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={
          <View className="py-20 items-center justify-center">
            <Text className="text-gray-500 font-medium">No agents found matching criteria.</Text>
          </View>
        }
      />
    </View>
  );
}
