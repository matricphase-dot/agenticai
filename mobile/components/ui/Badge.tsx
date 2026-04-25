import { View, Text } from 'react-native';
import { cn } from '../../lib/utils';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'error' | 'warning' | 'info' | 'purple' | 'gray';
  className?: string;
}

export const Badge = ({ label, variant = 'purple', className = '' }: BadgeProps) => {
  const variants = {
    success: 'bg-success/20 text-success',
    error: 'bg-error/20 text-error',
    warning: 'bg-warning/20 text-warning',
    info: 'bg-info/20 text-info',
    purple: 'bg-purple/20 text-purple',
    gray: 'bg-gray-500/20 text-gray-500'
  };

  return (
    <View className={cn('px-2 py-0.5 rounded-full', variants[variant], className)}>
      <Text className={cn('text-[10px] font-bold uppercase tracking-widest', variants[variant].split(' ')[1])}>
        {label}
      </Text>
    </View>
  );
};
