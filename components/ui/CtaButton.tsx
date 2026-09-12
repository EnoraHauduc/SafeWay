import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { BRAND } from '@/lib/brand';
import { cn } from '@/lib/utils';

export type CtaTone = 'lime' | 'ink' | 'lilac' | 'outline';

interface CtaButtonProps {
  label: string;
  onPress: () => void;
  tone?: CtaTone;
  /** Rendered to the right of the label, usually an arrow. */
  trailingIcon?: ReactNode;
  leadingIcon?: ReactNode;
  isDisabled?: boolean;
  isLoading?: boolean;
  size?: 'md' | 'lg';
  className?: string;
}

const TONE_CONTAINER: Record<CtaTone, string> = {
  lime: 'bg-lime',
  ink: 'bg-ink',
  lilac: 'bg-lilac-tint',
  outline: 'border border-border bg-surface',
};

const TONE_LABEL: Record<CtaTone, string> = {
  lime: 'text-ink',
  ink: 'text-white',
  lilac: 'text-ink',
  outline: 'text-ink',
};

export function CtaButton({
  label,
  onPress,
  tone = 'lime',
  trailingIcon,
  leadingIcon,
  isDisabled = false,
  isLoading = false,
  size = 'lg',
  className,
}: CtaButtonProps) {
  const disabled = isDisabled || isLoading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: disabled ? 0.55 : pressed ? 0.85 : 1 })}
      className={cn(
        'w-full flex-row items-center justify-center gap-2 rounded-2xl',
        size === 'lg' ? 'h-14' : 'h-12',
        TONE_CONTAINER[tone],
        className,
      )}
    >
      {isLoading ? (
        <ActivityIndicator color={tone === 'ink' ? BRAND.white : BRAND.ink} size="small" />
      ) : (
        <>
          {leadingIcon ? <View>{leadingIcon}</View> : null}
          <Text
            className={cn('text-base', TONE_LABEL[tone])}
            style={{ fontWeight: '700', letterSpacing: 0.1 }}
          >
            {label}
          </Text>
          {trailingIcon ? <View>{trailingIcon}</View> : null}
        </>
      )}
    </Pressable>
  );
}
