import React from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import { cn } from '../../lib/utils';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  leftIcon?: React.ReactNode;
}

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  leftIcon
}: ButtonProps) => {
  const variants = {
    primary: 'bg-purple',
    secondary: 'bg-card border border-border',
    ghost: 'bg-transparent',
    danger: 'bg-error'
  };

  const textColors = {
    primary: 'text-white',
    secondary: 'text-purple',
    ghost: 'text-purple',
    danger: 'text-white'
  };

  const sizes = {
    sm: 'px-3 py-1.5',
    md: 'px-5 py-3',
    lg: 'px-8 py-4'
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={cn(
        'rounded-md flex-row items-center justify-center',
        variants[variant],
        sizes[size],
        (disabled || loading) && 'opacity-50',
        className
      )}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? '#7C3AED' : 'white'} />
      ) : (
        <View className="flex-row items-center">
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          <Text className={cn('font-bold', textColors[variant])}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
};
