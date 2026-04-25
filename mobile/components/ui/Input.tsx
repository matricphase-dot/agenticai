import { View, Text, TextInput } from 'react-native';
import { cn } from '../../lib/utils';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  className?: string;
}

export const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType = 'default',
  className = ''
}: InputProps) => {
  return (
    <View className={cn('space-y-1.5', className)}>
      {label && (
        <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
          {label}
        </Text>
      )}
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#6B7280"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        className="bg-card border border-border rounded-md px-4 py-3 text-white font-medium"
      />
    </View>
  );
};
