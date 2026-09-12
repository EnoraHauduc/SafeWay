import { Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/utils';

export interface PillOption<T extends string> {
  value: T;
  label: string;
}

interface PillToggleProps<T extends string> {
  options: PillOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function PillToggle<T extends string>({
  options,
  value,
  onChange,
  className,
}: PillToggleProps<T>) {
  return (
    <View
      className={cn('bg-lilac-tint flex-row items-center gap-1 rounded-2xl p-1', className)}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            className={cn(
              'flex-1 items-center justify-center rounded-xl px-3 py-3',
              isSelected ? 'bg-lilac' : 'bg-transparent',
            )}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <Text
              className={cn('text-sm', isSelected ? 'text-ink' : 'text-muted')}
              style={{ fontWeight: isSelected ? '700' : '500' }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
