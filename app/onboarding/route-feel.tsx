import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { OnboardingStep } from '@/components/OnboardingStep';
import { OptionCard } from '@/components/ui/OptionCard';
import { usePreferences } from '@/lib/stores/preferences';

export default function RouteFeelScreen() {
  const { t } = useTranslation();
  const routeFeel = usePreferences((state) => state.routeFeel);
  const setRouteFeel = usePreferences((state) => state.setRouteFeel);

  return (
    <OnboardingStep
      backFallback="/onboarding/welcome"
      onNext={() => router.push('/onboarding/night-comfort')}
      step={2}
      subtitle={t('routeFeel.subtitle')}
      title={t('routeFeel.title')}
    >
      <View className="gap-3">
        <OptionCard
          image={require('@/assets/images/card-park.png')}
          isSelected={routeFeel === 'park'}
          meta={t('routeFeel.parkDescription')}
          onPress={() => setRouteFeel('park')}
          title={t('routeFeel.park')}
        />
        <OptionCard
          image={require('@/assets/images/card-main-street.png')}
          isSelected={routeFeel === 'main'}
          meta={t('routeFeel.mainDescription')}
          onPress={() => setRouteFeel('main')}
          title={t('routeFeel.main')}
        />
      </View>
    </OnboardingStep>
  );
}
