import { Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/utils';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedChoiceProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedChoice<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedChoiceProps<T>) {
  return (
    <View className={cn('flex-row gap-2', className)}>
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
            className={cn(
              'flex-1 items-center justify-center gap-1.5 rounded-2xl border px-2 py-3',
              isSelected ? 'border-amethyst bg-lilac-tint' : 'border-border bg-surface',
            )}
          >
            <View
              className={cn(
                'h-4 w-4 items-center justify-center rounded-full border-2',
                isSelected ? 'border-amethyst' : 'border-border',
              )}
            >
              {isSelected ? <View className="bg-amethyst h-2 w-2 rounded-full" /> : null}
            </View>
            <Text
              className={cn('text-center text-xs leading-4', isSelected ? 'text-ink' : 'text-muted')}
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
