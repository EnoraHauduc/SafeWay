import { View } from 'react-native';

import { cn } from '@/lib/utils';

interface RadioDotProps {
  isSelected: boolean;
  size?: number;
  className?: string;
}

export function RadioDot({ isSelected, size = 24, className }: RadioDotProps) {
  return (
    <View
      className={cn(
        'items-center justify-center rounded-full border-2',
        isSelected ? 'border-amethyst' : 'border-border',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {isSelected ? (
        <View
          className="bg-amethyst rounded-full"
          style={{ width: size * 0.5, height: size * 0.5 }}
        />
      ) : null}
    </View>
  );
}
