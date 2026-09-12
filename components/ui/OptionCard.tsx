import type { ImageSourcePropType } from 'react-native';
import { Image, Pressable, Text, View } from 'react-native';

import { RadioDot } from '@/components/ui/RadioDot';
import { cn } from '@/lib/utils';

interface OptionCardProps {
  title: string;
  subtitle?: string;
  meta?: string;
  image?: ImageSourcePropType;
  isSelected: boolean;
  onPress: () => void;
  layout?: 'stacked' | 'row';
  className?: string;
}

export function OptionCard({
  title,
  subtitle,
  meta,
  image,
  isSelected,
  onPress,
  layout = 'stacked',
  className,
}: OptionCardProps) {
  const containerClasses = cn(
    'rounded-2xl border',
    isSelected ? 'border-lime-deep bg-lime-wash' : 'border-border bg-surface',
    className,
  );

  if (layout === 'row') {
    return (
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ selected: isSelected }}
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
        className={cn(containerClasses, 'flex-row items-center gap-3 p-3')}
      >
        {image ? (
          <Image
            source={image}
            resizeMode="cover"
            style={{ width: 84, height: 64, borderRadius: 12 }}
          />
        ) : null}
        <View className="flex-1">
          <Text className="text-ink text-[15px]" style={{ fontWeight: '700' }}>
            {title}
          </Text>
          {subtitle ? (
            <Text className="text-ink-soft mt-0.5 text-xs leading-4">{subtitle}</Text>
          ) : null}
        </View>
        <RadioDot isSelected={isSelected} />
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
      className={cn(containerClasses, 'flex-row items-center gap-3 p-3')}
    >
      <View className="flex-1">
        {image ? (
          <Image
            source={image}
            resizeMode="cover"
            style={{ width: '100%', height: 96, borderRadius: 12 }}
          />
        ) : null}
        <Text className="text-ink mt-2.5 text-base" style={{ fontWeight: '700' }}>
          {title}
        </Text>
        {meta ? <Text className="text-ink-soft mt-0.5 text-sm">{meta}</Text> : null}
        {subtitle ? <Text className="text-ink-soft mt-0.5 text-xs">{subtitle}</Text> : null}
      </View>
      <RadioDot isSelected={isSelected} className="mr-1" />
    </Pressable>
  );
}
