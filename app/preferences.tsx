import { X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CtaButton } from '@/components/ui/CtaButton';
import { PillToggle } from '@/components/ui/PillToggle';
import { RadioDot } from '@/components/ui/RadioDot';
import { SegmentedChoice } from '@/components/ui/SegmentedChoice';
import { useNightMode } from '@/hooks/useNightMode';
import { BRAND } from '@/lib/brand';
import { goBackOrReplace } from '@/lib/navigation';
import { usePreferences, type TransitImportance } from '@/lib/stores/preferences';
import type {
  ActivityPreference,
  LightingPreference,
  StreetPreference,
  TravelMode,
} from '@/lib/routing';
import { cn } from '@/lib/utils';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="text-ink-soft text-xs uppercase" style={{ letterSpacing: 1 }}>
        {title}
      </Text>
      <View className="border-border bg-surface overflow-hidden rounded-2xl border">
        {children}
      </View>
    </View>
  );
}

function RadioRow({
  label,
  isSelected,
  onPress,
  isLast = false,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      className={cn(
        'flex-row items-center gap-3 px-4 py-3.5',
        isLast ? '' : 'border-separator border-b',
      )}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <Text
        className={cn('flex-1 text-sm', isSelected ? 'text-ink' : 'text-ink-soft')}
        style={{ fontWeight: isSelected ? '700' : '500' }}
      >
        {label}
      </Text>
      <RadioDot isSelected={isSelected} size={20} />
    </Pressable>
  );
}

export default function PreferencesScreen() {
  const { t } = useTranslation();
  const lighting = usePreferences((state) => state.lighting);
  const streetType = usePreferences((state) => state.streetType);
  const activity = usePreferences((state) => state.activity);
  const autoNightMode = usePreferences((state) => state.autoNightMode);
  const extraTimeMinutes = usePreferences((state) => state.extraTimeMinutes);
  const transitImportance = usePreferences((state) => state.transitImportance);
  const mode = usePreferences((state) => state.mode);
  const setLighting = usePreferences((state) => state.setLighting);
  const setStreetType = usePreferences((state) => state.setStreetType);
  const setActivity = usePreferences((state) => state.setActivity);
  const setAutoNightMode = usePreferences((state) => state.setAutoNightMode);
  const setNightOverride = usePreferences((state) => state.setNightOverride);
  const setExtraTimeMinutes = usePreferences((state) => state.setExtraTimeMinutes);
  const setTransitImportance = usePreferences((state) => state.setTransitImportance);
  const setMode = usePreferences((state) => state.setMode);
  const night = useNightMode();

  const lightingOptions: { value: LightingPreference; label: string }[] = [
    { value: 'prefer_lit', label: t('prefs.lightingPreferLit') },
    { value: 'avoid_unlit', label: t('prefs.lightingAvoidUnlit') },
    { value: 'none', label: t('prefs.lightingNone') },
  ];

  const streetOptions: { value: StreetPreference; label: string }[] = [
    { value: 'residential', label: t('prefs.streetResidential') },
    { value: 'main', label: t('prefs.streetMain') },
    { value: 'avoid_isolated', label: t('prefs.streetAvoidIsolated') },
    { value: 'none', label: t('prefs.streetNone') },
  ];

  const activityOptions: { value: ActivityPreference; label: string }[] = [
    { value: 'quiet', label: t('prefs.activityQuiet') },
    { value: 'moderate', label: t('prefs.activityModerate') },
    { value: 'busy', label: t('prefs.activityBusy') },
  ];

  return (
    <View className="bg-mist flex-1">
      <View className="flex-row items-center gap-3 px-4 pt-4">
        <View className="flex-1">
          <Text className="text-ink text-xl" style={{ fontWeight: '800' }}>
            {t('prefs.title')}
          </Text>
          <Text className="text-ink-soft mt-0.5 text-xs">{t('prefs.subtitle')}</Text>
        </View>
        <Pressable
          accessibilityLabel={t('common.close')}
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => goBackOrReplace('/(tabs)')}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <X color={BRAND.ink} size={22} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerClassName="gap-4 px-4 pb-6 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <Section title={t('prefs.modeTitle')}>
          <View className="p-2">
            <PillToggle<TravelMode>
              onChange={setMode}
              options={[
                { value: 'walking', label: t('map.modeWalking') },
                { value: 'cycling', label: t('map.modeCycling') },
                { value: 'driving', label: t('map.modeDriving') },
              ]}
              value={mode}
            />
          </View>
        </Section>

        <Section title={t('prefs.lightingTitle')}>
          {lightingOptions.map((option, index) => (
            <RadioRow
              key={option.value}
              isLast={index === lightingOptions.length - 1}
              isSelected={lighting === option.value}
              label={option.label}
              onPress={() => setLighting(option.value)}
            />
          ))}
        </Section>

        <Section title={t('prefs.streetTitle')}>
          {streetOptions.map((option, index) => (
            <RadioRow
              key={option.value}
              isLast={index === streetOptions.length - 1}
              isSelected={streetType === option.value}
              label={option.label}
              onPress={() => setStreetType(option.value)}
            />
          ))}
        </Section>

        <Section title={t('prefs.activityTitle')}>
          {activityOptions.map((option, index) => (
            <RadioRow
              key={option.value}
              isLast={index === activityOptions.length - 1}
              isSelected={activity === option.value}
              label={option.label}
              onPress={() => setActivity(option.value)}
            />
          ))}
        </Section>

        <Section title={t('prefs.nightTitle')}>
          <View className="flex-row items-center gap-3 px-4 py-3.5">
            <View className="flex-1">
              <Text className="text-ink text-sm" style={{ fontWeight: '600' }}>
                {t('prefs.nightDescription')}
              </Text>
              <Text className="text-ink-soft mt-0.5 text-xs">
                {night.isNight ? t('prefs.nightActive') : t('prefs.nightInactive')}
              </Text>
            </View>
            <Switch
              accessibilityLabel={t('prefs.nightTitle')}
              ios_backgroundColor={BRAND.lilacSoft}
              onValueChange={(next) => {
                setAutoNightMode(next);
                setNightOverride(null);
              }}
              thumbColor={BRAND.white}
              trackColor={{ false: BRAND.lilacSoft, true: BRAND.lime }}
              value={autoNightMode}
            />
          </View>
        </Section>

        <Section title={t('prefs.extraTimeTitle')}>
          <View className="p-3">
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
        </Section>

        <Section title={t('prefs.transitTitle')}>
          <View className="p-3">
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
        </Section>
      </ScrollView>

      <View className="border-border bg-mist pb-safe-offset-3 border-t px-4 pt-3">
        <CtaButton
          label={t('prefs.saveCta')}
          onPress={() => goBackOrReplace('/(tabs)')}
          tone="lime"
        />
      </View>
    </View>
  );
}
