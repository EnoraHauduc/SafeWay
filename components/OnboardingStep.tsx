import { ArrowRight, ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Href } from 'expo-router';

import { CtaButton } from '@/components/ui/CtaButton';
import { ProgressSteps } from '@/components/ui/ProgressSteps';
import { BRAND } from '@/lib/brand';
import { goBackOrReplace } from '@/lib/navigation';

interface OnboardingStepProps {
  step: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  ctaLabel?: string;
  onNext: () => void;
  backFallback: Href;
  isCtaDisabled?: boolean;
}

const TOTAL_STEPS = 6;

export function OnboardingStep({
  step,
  title,
  subtitle,
  children,
  ctaLabel,
  onNext,
  backFallback,
  isCtaDisabled = false,
}: OnboardingStepProps) {
  const { t } = useTranslation();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="bg-mist flex-1"
    >
      <View className="flex-row items-center gap-3 px-5 pt-safe-offset-2">
        <Pressable
          accessibilityLabel={t('common.back')}
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => goBackOrReplace(backFallback)}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <ChevronLeft color={BRAND.ink} size={26} />
        </Pressable>
        <ProgressSteps className="flex-1" current={step} total={TOTAL_STEPS} />
      </View>

      <ScrollView
        contentContainerClassName="px-5 pb-6 pt-5 gap-5"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-2">
          <Text className="text-ink text-[28px] leading-9" style={{ fontWeight: '800' }}>
            {title}
          </Text>
          {subtitle ? (
            <Text className="text-ink-soft text-sm leading-5">{subtitle}</Text>
          ) : null}
        </View>
        {children}
      </ScrollView>

      <View className="border-border bg-mist border-t px-5 pb-safe-offset-3 pt-3">
        <CtaButton
          isDisabled={isCtaDisabled}
          label={ctaLabel ?? t('common.next')}
          onPress={onNext}
          tone="lime"
          trailingIcon={<ArrowRight color={BRAND.ink} size={18} />}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
