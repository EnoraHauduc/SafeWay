import { Globe } from 'lucide-react-native';
import { Image, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { SafeWayLogo } from '@/components/SafeWayLogo';
import { CtaButton } from '@/components/ui/CtaButton';
import { BRAND } from '@/lib/brand';
import { SUPPORTED_LANGUAGES, type Language } from '@/lib/i18n';
import { usePreferences } from '@/lib/stores/preferences';
import { cn } from '@/lib/utils';

const LANGUAGE_LABELS: Record<Language, string> = { en: 'English', de: 'Deutsch' };

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const language = usePreferences((state) => state.language);
  const setLanguage = usePreferences((state) => state.setLanguage);
  const completeOnboarding = usePreferences((state) => state.completeOnboarding);

  const heroHeight = Math.min(360, Math.round(width * 0.92));

  return (
    <View className="bg-mist flex-1">
      <ScrollView
        contentContainerClassName="gap-5 px-5 pb-safe-offset-6 pt-safe-offset-4"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center gap-2">
          <SafeWayLogo size={34} variant="signature" />
          <Text className="text-ink mt-1 text-[30px] leading-9" style={{ fontWeight: '800' }}>
            {t('welcome.tagline')}
          </Text>
          <Text className="text-ink-soft max-w-[19rem] text-center text-sm leading-5">
            {t('welcome.subtitle')}
          </Text>
        </View>

        <Image
          accessibilityIgnoresInvertColors
          resizeMode="cover"
          source={require('@/assets/images/hero-night-walk.png')}
          style={{ width: '100%', height: heroHeight, borderRadius: 24 }}
        />

        <View className="gap-3">
          <View className="border-border bg-surface flex-row items-center gap-3 rounded-2xl border px-4 py-3">
            <Globe color={BRAND.amethyst} size={18} />
            {SUPPORTED_LANGUAGES.map((code) => {
              const isSelected = code === language;
              return (
                <Pressable
                  key={code}
                  accessibilityLabel={LANGUAGE_LABELS[code]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  className="flex-1 flex-row items-center justify-center gap-2"
                  onPress={() => setLanguage(code)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <Text
                    className={cn('text-sm', isSelected ? 'text-ink' : 'text-muted')}
                    style={{ fontWeight: isSelected ? '700' : '500' }}
                  >
                    {LANGUAGE_LABELS[code]}
                  </Text>
                  <View
                    className={cn(
                      'h-3.5 w-3.5 rounded-full border-2',
                      isSelected ? 'border-amethyst bg-amethyst' : 'border-border',
                    )}
                  />
                </Pressable>
              );
            })}
          </View>

          <CtaButton
            label={t('welcome.primary')}
            onPress={() => router.push('/onboarding/route-feel')}
            tone="lime"
          />
          <CtaButton
            label={t('welcome.secondary')}
            onPress={() => {
              completeOnboarding();
              router.replace('/(tabs)');
            }}
            tone="lilac"
          />
          <Text
            className="text-muted mt-1 text-center text-[11px] uppercase"
            style={{ letterSpacing: 1.1 }}
          >
            {t('welcome.footer')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
