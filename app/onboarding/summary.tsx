import { ArrowRight, ChevronRight, Clock, Lightbulb, TrainFront, Users } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { CtaButton } from '@/components/ui/CtaButton';
import { ProgressSteps } from '@/components/ui/ProgressSteps';
import { BRAND } from '@/lib/brand';
import { activityLabel, extraTimeLabel, lightingLabel, transitLabel } from '@/lib/labels';
import { usePreferences } from '@/lib/stores/preferences';

interface SummaryRowProps {
  icon: ReactNode;
  title: string;
  value: string;
  editHref: Href;
}

function SummaryRow({ icon, title, value, editHref }: SummaryRowProps) {
  const { t } = useTranslation();

  return (
    <View className="border-border bg-surface flex-row items-center gap-3 rounded-2xl border px-4 py-3.5">
      <View className="bg-lilac-tint h-9 w-9 items-center justify-center rounded-full">{icon}</View>
      <View className="flex-1">
        <Text className="text-ink text-[15px]" style={{ fontWeight: '700' }}>
          {value}
        </Text>
        <Text className="text-ink-soft mt-0.5 text-xs">{title}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => router.push(editHref)}
        style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
      >
        <Text className="text-amethyst text-sm" style={{ fontWeight: '700' }}>
          {t('common.edit')}
        </Text>
      </Pressable>
    </View>
  );
}

export default function SummaryScreen() {
  const { t } = useTranslation();
  const activity = usePreferences((state) => state.activity);
  const lighting = usePreferences((state) => state.lighting);
  const extraTimeMinutes = usePreferences((state) => state.extraTimeMinutes);
  const transitImportance = usePreferences((state) => state.transitImportance);
  const completeOnboarding = usePreferences((state) => state.completeOnboarding);

  return (
    <View className="bg-mist flex-1">
      <View className="pt-safe-offset-2 px-5">
        <ProgressSteps current={6} total={6} />
      </View>

      <ScrollView
        contentContainerClassName="gap-4 px-5 pb-6 pt-5"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-2">
          <Text className="text-ink text-[28px] leading-9" style={{ fontWeight: '800' }}>
            {t('summary.title')}
          </Text>
          <Text className="text-ink-soft text-sm leading-5">{t('summary.subtitle')}</Text>
        </View>

        <View className="gap-2.5">
          <SummaryRow
            editHref="/onboarding/night-comfort"
            icon={<Users color={BRAND.amethyst} size={17} />}
            title={t('summary.activityRow')}
            value={activityLabel(t, activity)}
          />
          <SummaryRow
            editHref="/onboarding/lighting"
            icon={<Lightbulb color={BRAND.amethyst} size={17} />}
            title={t('summary.lightingRow')}
            value={lightingLabel(t, lighting)}
          />
          <SummaryRow
            editHref="/onboarding/extras"
            icon={<Clock color={BRAND.amethyst} size={17} />}
            title={t('summary.timeRow')}
            value={extraTimeLabel(t, extraTimeMinutes)}
          />
          <SummaryRow
            editHref="/onboarding/extras"
            icon={<TrainFront color={BRAND.amethyst} size={17} />}
            title={t('summary.transitRow')}
            value={transitLabel(t, transitImportance)}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          className="bg-lilac-tint flex-row items-center gap-3 rounded-2xl px-4 py-4"
          onPress={() => router.push('/trusted-contact')}
          style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
        >
          <View className="bg-lilac h-9 w-9 items-center justify-center rounded-full">
            <Users color={BRAND.ink} size={17} />
          </View>
          <View className="flex-1">
            <Text className="text-ink text-[15px]" style={{ fontWeight: '700' }}>
              {t('summary.trustedTitle')}
            </Text>
            <Text className="text-ink-soft mt-0.5 text-xs">{t('summary.trustedSubtitle')}</Text>
          </View>
          <ChevronRight color={BRAND.inkSoft} size={20} />
        </Pressable>
      </ScrollView>

      <View className="border-border bg-mist pb-safe-offset-3 border-t px-5 pt-3">
        <CtaButton
          label={t('summary.openMap')}
          onPress={() => {
            completeOnboarding();
            router.replace('/(tabs)');
          }}
          tone="lime"
          trailingIcon={<ArrowRight color={BRAND.ink} size={18} />}
        />
      </View>
    </View>
  );
}
