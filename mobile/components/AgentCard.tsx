import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Star, ArrowRight } from 'lucide-react-native';
import { router } from 'expo-router';

export const AgentCard = ({ agent }: { agent: any }) => {
  return (
    <Card 
      className="mb-4"
      onPress={() => router.push(`/agent/${agent.id}`)}
    >
      <View className="flex-row items-center justify-between mb-3">
        <Badge label={agent.category} />
        <View className="flex-row items-center">
          <Star size={12} color="#F59E0B" fill="#F59E0B" />
          <Text className="text-white text-xs font-bold ml-1">{agent.rating || '5.0'}</Text>
        </View>
      </View>

      <Text className="text-white text-lg font-bold mb-1">{agent.name}</Text>
      <Text className="text-gray-400 text-sm mb-4" numberOfLines={2}>
        {agent.description}
      </Text>

      <View className="flex-row items-center justify-between border-t border-border pt-4">
        <View className="flex-row items-center">
          <Image 
            source={{ uri: agent.creator?.avatar || 'https://github.com/shadcn.png' }} 
            className="w-6 h-6 rounded-full mr-2"
          />
          <Text className="text-gray-300 text-xs">{agent.creator?.name}</Text>
        </View>
        <View className="flex-row items-center">
          <Text className="text-purple font-bold mr-2">
            {agent.price > 0 ? `${agent.price} Credits` : 'FREE'}
          </Text>
          <ArrowRight size={14} color="#7C3AED" />
        </View>
      </View>
    </Card>
  );
};
