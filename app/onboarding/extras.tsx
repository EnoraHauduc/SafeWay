import { Clock, TrainFront } from 'lucide-react-native';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { OnboardingStep } from '@/components/OnboardingStep';
import { SegmentedChoice } from '@/components/ui/SegmentedChoice';
import { BRAND } from '@/lib/brand';
import { usePreferences, type TransitImportance } from '@/lib/stores/preferences';

export default function ExtrasScreen() {
  const { t } = useTranslation();
  const transitImportance = usePreferences((state) => state.transitImportance);
  const extraTimeMinutes = usePreferences((state) => state.extraTimeMinutes);
  const setTransitImportance = usePreferences((state) => state.setTransitImportance);
  const setExtraTimeMinutes = usePreferences((state) => state.setExtraTimeMinutes);

  return (
    <OnboardingStep
      backFallback="/onboarding/lighting"
      onNext={() => router.push('/onboarding/summary')}
      step={5}
      subtitle={t('extras.subtitle')}
      title={t('extras.title')}
    >
      <View className="border-border bg-surface gap-3 rounded-2xl border p-4">
        <View className="flex-row items-center gap-3">
          <View className="bg-lilac-tint h-9 w-9 items-center justify-center rounded-full">
            <TrainFront color={BRAND.amethyst} size={17} />
          </View>
          <Text className="text-ink flex-1 text-sm leading-5" style={{ fontWeight: '600' }}>
            {t('extras.transitQuestion')}
          </Text>
        </View>
        <SegmentedChoice<TransitImportance>
          onChange={setTransitImportance}
          options={[
            { value: 'not', label: t('extras.transitNot') },
            { value: 'somewhat', label: t('extras.transitSomewhat') },
            { value: 'very', label: t('extras.transitVery') },
          ]}
          value={transitImportance}
        />
      </View>

      <View className="border-border bg-surface gap-3 rounded-2xl border p-4">
        <View className="flex-row items-center gap-3">
          <View className="bg-lilac-tint h-9 w-9 items-center justify-center rounded-full">
            <Clock color={BRAND.amethyst} size={17} />
          </View>
          <Text className="text-ink flex-1 text-sm leading-5" style={{ fontWeight: '600' }}>
            {t('extras.timeQuestion')}
          </Text>
        </View>
        <SegmentedChoice
          onChange={(value) => setExtraTimeMinutes(Number(value))}
          options={[
            { value: '0', label: t('extras.timeNone') },
            { value: '5', label: t('extras.timeFive') },
            { value: '10', label: t('extras.timeTen') },
          ]}
          value={String(extraTimeMinutes)}
        />
      </View>
    </OnboardingStep>
  );
}
