import { View, Pressable } from 'react-native';
import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
}

export const Card = ({ children, className = '', onPress }: CardProps) => {
  const Container = onPress ? Pressable : View;

  return (
    <Container
      onPress={onPress}
      className={cn(
        'bg-card rounded-xl border border-border p-4',
        className
      )}
    >
      {children}
    </Container>
  );
};
