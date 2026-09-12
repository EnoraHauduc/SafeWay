import { Text, View } from 'react-native';

import { cn } from '@/lib/utils';

interface ProgressStepsProps {
  current: number;
  total: number;
  className?: string;
}

export function ProgressSteps({ current, total, className }: ProgressStepsProps) {
  const steps = Array.from({ length: total }, (_, index) => index + 1);

  return (
    <View className={cn('flex-row items-center gap-2', className)}>
      <View className="flex-1 flex-row items-center gap-1.5">
        {steps.map((step) => (
          <View
            key={step}
            className={cn(
              'h-1.5 rounded-full',
              step <= current ? 'bg-amethyst w-6' : 'bg-lilac-soft w-2.5',
            )}
          />
        ))}
      </View>
      <Text className="text-ink-soft text-xs" style={{ fontWeight: '600' }}>
        {current}/{total}
      </Text>
    </View>
  );
}
