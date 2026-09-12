import { ChevronRight, Info, Moon, RotateCcw, Sliders, Users } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Switch } from 'heroui-native';
import { useTranslation } from 'react-i18next';

import { SafeWayLogo } from '@/components/SafeWayLogo';
import { PillToggle } from '@/components/ui/PillToggle';
import { useNightMode } from '@/hooks/useNightMode';
import { BRAND } from '@/lib/brand';
import { activityLabel, lightingLabel } from '@/lib/labels';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n';
import { usePreferences } from '@/lib/stores/preferences';

const LANGUAGE_LABELS = { en: 'English', de: 'Deutsch' } as const;

function Row({
  icon,
  title,
  subtitle,
  onPress,
  trailing,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  trailing?: ReactNode;
}) {
  const content = (
    <View className="flex-row items-center gap-3 px-4 py-3.5">
      <View className="bg-lilac-tint h-9 w-9 items-center justify-center rounded-full">{icon}</View>
      <View className="flex-1">
        <Text className="text-ink text-[15px]" style={{ fontWeight: '600' }}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-ink-soft mt-0.5 text-xs leading-4">{subtitle}</Text>
        ) : null}
      </View>
      {trailing ?? (onPress ? <ChevronRight color={BRAND.inkSoft} size={18} /> : null)}
    </View>
  );

  if (!onPress) return <View className="border-border bg-surface rounded-2xl border">{content}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      className="border-border bg-surface rounded-2xl border"
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      {content}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const language = usePreferences((state) => state.language);
  const setLanguage = usePreferences((state) => state.setLanguage);
  const lighting = usePreferences((state) => state.lighting);
  const activity = usePreferences((state) => state.activity);
  const autoNightMode = usePreferences((state) => state.autoNightMode);
  const setAutoNightMode = usePreferences((state) => state.setAutoNightMode);
  const setNightOverride = usePreferences((state) => state.setNightOverride);
  const trustedContact = usePreferences((state) => state.trustedContact);
  const restartOnboarding = usePreferences((state) => state.restartOnboarding);
  const night = useNightMode();

  return (
    <ScrollView
      className="bg-mist flex-1"
      contentContainerClassName="gap-2.5 px-4 pb-safe-offset-8 pt-2"
      showsVerticalScrollIndicator={false}
    >
      <View className="items-center py-2">
        <SafeWayLogo size={26} variant="everyday" />
      </View>

      <Row
        icon={<Sliders color={BRAND.amethyst} size={17} />}
        onPress={() => router.push('/preferences')}
        subtitle={`${lightingLabel(t, lighting)} · ${activityLabel(t, activity)}`}
        title={t('profile.preferences')}
      />

      <Row
        icon={<Moon color={BRAND.amethyst} size={17} />}
        subtitle={night.isNight ? t('prefs.nightActive') : t('profile.nightModeSubtitle')}
        title={t('profile.nightMode')}
        trailing={
          <Switch
            animation={{ backgroundColor: { value: [BRAND.lilacSoft, BRAND.lime] } }}
            isSelected={autoNightMode}
            onSelectedChange={(next) => {
              setAutoNightMode(next);
              setNightOverride(null);
            }}
          >
            <Switch.Thumb />
          </Switch>
        }
      />

      <Row
        icon={<Users color={BRAND.amethyst} size={17} />}
        onPress={() => router.push('/trusted-contact')}
        subtitle={trustedContact ? trustedContact.name : t('profile.trustedContactEmpty')}
        title={t('profile.trustedContact')}
      />

      <View className="border-border bg-surface gap-3 rounded-2xl border p-4">
        <Text className="text-ink text-[15px]" style={{ fontWeight: '600' }}>
          {t('profile.language')}
        </Text>
        <PillToggle
          onChange={setLanguage}
          options={SUPPORTED_LANGUAGES.map((code) => ({
            value: code,
            label: LANGUAGE_LABELS[code],
          }))}
          value={language}
        />
      </View>

      <Row
        icon={<RotateCcw color={BRAND.amethyst} size={17} />}
        onPress={() => {
          restartOnboarding();
          router.replace('/onboarding/welcome');
        }}
        title={t('profile.replayOnboarding')}
      />

      <View className="border-border bg-surface gap-2 rounded-2xl border p-4">
        <View className="flex-row items-center gap-2">
          <Info color={BRAND.amethyst} size={16} />
          <Text className="text-ink text-[15px]" style={{ fontWeight: '600' }}>
            {t('profile.about')}
          </Text>
        </View>
        <Text className="text-ink-soft text-xs leading-5">{t('profile.aboutBody')}</Text>
      </View>
    </ScrollView>
  );
}
