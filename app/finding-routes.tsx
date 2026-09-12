import { useCallback, useEffect, useRef } from 'react';
import { Compass } from 'lucide-react-native';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { CtaButton } from '@/components/ui/CtaButton';
import { useNightMode } from '@/hooks/useNightMode';
import { BRAND } from '@/lib/brand';
import { goBackOrReplace } from '@/lib/navigation';
import { effectivePrefs } from '@/lib/routing';
import { usePreferences } from '@/lib/stores/preferences';
import { useSession } from '@/lib/stores/session';

function PulsingCompass() {
  const progress = useSharedValue(0);

  useEffect(() => {
    // Reanimated shared values are designed to be mutated directly via `.value`; that is the
    // library's sanctioned API, not a React state update the compiler needs to track.
    // eslint-disable-next-line react/immutability
    progress.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
  }, [progress]);

  const outerStyle = useAnimatedStyle(() => ({
    opacity: 0.35 * (1 - progress.value),
    transform: [{ scale: 0.7 + progress.value * 0.9 }],
  }));

  const innerStyle = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - progress.value),
    transform: [{ scale: 0.6 + progress.value * 0.55 }],
  }));

  return (
    <View className="h-44 w-44 items-center justify-center">
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 176,
            height: 176,
            borderRadius: 88,
            backgroundColor: BRAND.lilac,
          },
          outerStyle,
        ]}
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 132,
            height: 132,
            borderRadius: 66,
            backgroundColor: BRAND.lilac,
          },
          innerStyle,
        ]}
      />
      <View
        className="items-center justify-center rounded-full"
        style={{ width: 84, height: 84, backgroundColor: BRAND.white }}
      >
        <Compass color={BRAND.amethyst} size={36} />
      </View>
    </View>
  );
}

export default function FindingRoutesScreen() {
  const { t } = useTranslation();
  const status = useSession((state) => state.status);
  const errorCode = useSession((state) => state.errorCode);
  const destination = useSession((state) => state.destination);
  const search = useSession((state) => state.search);

  const mode = usePreferences((state) => state.mode);
  const lighting = usePreferences((state) => state.lighting);
  const streetType = usePreferences((state) => state.streetType);
  const activity = usePreferences((state) => state.activity);
  const extraTimeMinutes = usePreferences((state) => state.extraTimeMinutes);
  const language = usePreferences((state) => state.language);
  const night = useNightMode();

  const run = useCallback(async () => {
    const ok = await search({
      mode,
      prefs: effectivePrefs({ lighting, streetType, activity, extraTimeMinutes }, night.isNight),
      language,
    });
    if (ok) router.replace('/routes');
  }, [activity, extraTimeMinutes, language, lighting, mode, night.isNight, search, streetType]);

  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void run();
  }, [run]);

  const failed = status === 'error';

  return (
    <View className="bg-mist flex-1 items-center justify-center gap-6 px-8">
      {failed ? (
        <View className="w-full items-center gap-5">
          <Text className="text-ink text-center text-xl" style={{ fontWeight: '800' }}>
            {t(`errors.${errorCode ?? 'generic'}`, { defaultValue: t('errors.generic') })}
          </Text>
          <View className="w-full gap-2.5">
            <CtaButton label={t('common.tryAgain')} onPress={() => void run()} tone="lime" />
            <CtaButton
              label={t('common.back')}
              onPress={() => goBackOrReplace('/(tabs)')}
              tone="lilac"
            />
          </View>
        </View>
      ) : (
        <>
          <PulsingCompass />
          <View className="items-center gap-2">
            <Text className="text-ink text-center text-2xl" style={{ fontWeight: '800' }}>
              {t('routes.findingTitle')}
            </Text>
            <Text className="text-ink-soft text-center text-sm leading-5">
              {t('routes.findingSubtitle')}
            </Text>
            {destination ? (
              <Text
                className="text-amethyst mt-1 text-center text-sm"
                style={{ fontWeight: '600' }}
              >
                {destination.name}
              </Text>
            ) : null}
          </View>
        </>
      )}
    </View>
  );
}
