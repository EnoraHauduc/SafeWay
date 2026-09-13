import { Lightbulb } from 'lucide-react-native';
import { router } from 'expo-router';
import { Image, Switch, Text, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { OnboardingStep } from '@/components/OnboardingStep';
import { PillToggle } from '@/components/ui/PillToggle';
import { BRAND } from '@/lib/brand';
import { usePreferences } from '@/lib/stores/preferences';

export default function LightingScreen() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const lighting = usePreferences((state) => state.lighting);
  const streetType = usePreferences((state) => state.streetType);
  const setLighting = usePreferences((state) => state.setLighting);
  const setStreetType = usePreferences((state) => state.setStreetType);

  const preferLit = lighting !== 'none';
  const streetValue = streetType === 'main' ? 'main' : 'side';
  const imageHeight = Math.min(230, Math.round(width * 0.55));

  return (
    <OnboardingStep
      backFallback="/onboarding/night-comfort"
      onNext={() => router.push('/onboarding/extras')}
      step={4}
      subtitle={t('lighting.subtitle')}
      title={t('lighting.title')}
    >
      <View className="overflow-hidden rounded-[20px]">
        <Image
          accessibilityIgnoresInvertColors
          resizeMode="cover"
          source={require('@/assets/images/card-main-street.png')}
          style={{ width: '100%', height: imageHeight }}
        />
        {!preferLit ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: 'rgba(24, 18, 48, 0.58)',
            }}
          />
        ) : null}
      </View>

      <View className="border-border bg-surface flex-row items-center gap-3 rounded-2xl border p-4">
        <View className="bg-lilac-tint h-10 w-10 items-center justify-center rounded-full">
          <Lightbulb color={preferLit ? BRAND.amethyst : BRAND.muted} size={18} />
        </View>
        <Text className="text-ink flex-1 text-[15px] leading-5" style={{ fontWeight: '600' }}>
          {t('lighting.toggle')}
        </Text>
        <Switch
          accessibilityLabel={t('lighting.toggle')}
          ios_backgroundColor={BRAND.lilacSoft}
          onValueChange={(next) => setLighting(next ? 'prefer_lit' : 'none')}
          thumbColor={BRAND.white}
          trackColor={{ false: BRAND.lilacSoft, true: BRAND.lime }}
          value={preferLit}
        />
      </View>

      <View className="gap-2">
        <Text className="text-ink text-sm" style={{ fontWeight: '600' }}>
          {t('lighting.whichStreets')}
        </Text>
        <PillToggle
          onChange={(value) => setStreetType(value === 'main' ? 'main' : 'residential')}
          options={[
            { value: 'main', label: t('lighting.mainStreets') },
            { value: 'side', label: t('lighting.sideStreets') },
          ]}
          value={streetValue}
        />
      </View>
    </OnboardingStep>
  );
}
