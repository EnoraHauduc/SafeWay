import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { OnboardingStep } from '@/components/OnboardingStep';
import { OptionCard } from '@/components/ui/OptionCard';
import { usePreferences } from '@/lib/stores/preferences';

export default function NightComfortScreen() {
  const { t } = useTranslation();
  const activity = usePreferences((state) => state.activity);
  const setActivity = usePreferences((state) => state.setActivity);

  return (
    <OnboardingStep
      backFallback="/onboarding/route-feel"
      onNext={() => router.push('/onboarding/lighting')}
      step={3}
      subtitle={t('nightComfort.subtitle')}
      title={t('nightComfort.title')}
    >
      <View className="gap-3">
        <OptionCard
          image={require('@/assets/images/card-residential.png')}
          isSelected={activity === 'quiet'}
          layout="row"
          onPress={() => setActivity('quiet')}
          subtitle={t('nightComfort.quietDescription')}
          title={t('nightComfort.quietTitle')}
        />
        <OptionCard
          image={require('@/assets/images/card-some-people.png')}
          isSelected={activity === 'moderate'}
          layout="row"
          onPress={() => setActivity('moderate')}
          subtitle={t('nightComfort.moderateDescription')}
          title={t('nightComfort.moderateTitle')}
        />
        <OptionCard
          image={require('@/assets/images/card-busy-street.png')}
          isSelected={activity === 'busy'}
          layout="row"
          onPress={() => setActivity('busy')}
          subtitle={t('nightComfort.busyDescription')}
          title={t('nightComfort.busyTitle')}
        />
      </View>
    </OnboardingStep>
  );
}
