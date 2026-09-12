import { useMemo } from 'react';
import { Bike, Car, ChevronRight, Footprints, House, Moon, Search, Briefcase } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Switch } from 'heroui-native';
import { useTranslation } from 'react-i18next';

import MapView from '@/components/MapView';
import { zoomToRegion, type MapMarker } from '@/components/MapView.types';
import { SafeWayLogo } from '@/components/SafeWayLogo';
import { useNightMode } from '@/hooks/useNightMode';
import { BRAND } from '@/lib/brand';
import { activityLabel, lightingLabel } from '@/lib/labels';
import { usePreferences } from '@/lib/stores/preferences';
import { useSession } from '@/lib/stores/session';
import { useTrips } from '@/lib/stores/trips';
import type { Place, TravelMode } from '@/lib/routing';
import { cn } from '@/lib/utils';

const MODE_ICONS: Record<TravelMode, typeof Footprints> = {
  walking: Footprints,
  cycling: Bike,
  driving: Car,
};

export default function MapScreen() {
  const { t } = useTranslation();
  const location = useSession((state) => state.location);
  const locationStatus = useSession((state) => state.locationStatus);
  const setDestination = useSession((state) => state.setDestination);
  const setOrigin = useSession((state) => state.setOrigin);
  const home = useTrips((state) => state.home);
  const work = useTrips((state) => state.work);
  const mode = usePreferences((state) => state.mode);
  const setMode = usePreferences((state) => state.setMode);
  const lighting = usePreferences((state) => state.lighting);
  const activity = usePreferences((state) => state.activity);
  const setNightOverride = usePreferences((state) => state.setNightOverride);
  const night = useNightMode();

  const region = useMemo(
    () => zoomToRegion({ latitude: location.lat, longitude: location.lng }, 14),
    [location],
  );

  const markers = useMemo<MapMarker[]>(() => {
    const list: MapMarker[] = [
      {
        id: 'me',
        coordinate: { latitude: location.lat, longitude: location.lng },
        title: t('map.yourLocation'),
        color: BRAND.amethyst,
      },
    ];
    if (home) {
      list.push({
        id: 'home',
        coordinate: { latitude: home.lat, longitude: home.lng },
        title: t('map.home'),
        color: BRAND.lilac,
      });
    }
    if (work) {
      list.push({
        id: 'work',
        coordinate: { latitude: work.lat, longitude: work.lng },
        title: t('map.work'),
        color: BRAND.lilac,
      });
    }
    return list;
  }, [home, location, t, work]);

  const startTrip = (place: Place) => {
    setOrigin(null);
    setDestination(place);
    router.push('/finding-routes');
  };

  const preferenceSummary = [
    night.isNight ? t('prefs.nightTitle') : null,
    lightingLabel(t, lighting),
    activityLabel(t, activity),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View className="bg-mist flex-1">
      <MapView
        className="absolute inset-0"
        markers={markers}
        region={region}
        showsCompass={false}
        showsMyLocationButton={false}
        showsPointsOfInterest={false}
        showsScale={false}
        showsUserLocation
        style={{ flex: 1 }}
      />

      <View className="absolute left-0 right-0 top-0 gap-2.5 px-4 pt-safe-offset-2">
        <View className="border-border bg-surface flex-row items-center justify-between rounded-2xl border px-3.5 py-2.5">
          <SafeWayLogo size={19} variant="everyday" />
          <View className="flex-row items-center gap-2">
            <Moon color={night.isNight ? BRAND.amethyst : BRAND.muted} size={16} />
            <Text className="text-ink text-xs" style={{ fontWeight: '600' }}>
              {t('map.nightPreferences')}
            </Text>
            <Switch
              animation={{ backgroundColor: { value: [BRAND.lilacSoft, BRAND.lime] } }}
              isSelected={night.isNight}
              onSelectedChange={(next) => setNightOverride(next === night.afterSunset ? null : next)}
            >
              <Switch.Thumb />
            </Switch>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          className="border-border bg-surface flex-row items-center gap-3 rounded-2xl border px-4 py-3.5"
          onPress={() => router.push('/search')}
          style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
        >
          <Search color={BRAND.amethyst} size={18} />
          <Text className="text-muted flex-1 text-sm">{t('map.searchPlaceholder')}</Text>
        </Pressable>

        {locationStatus === 'denied' ? (
          <View className="bg-lilac-tint rounded-2xl px-4 py-2.5">
            <Text className="text-ink-soft text-xs leading-4">{t('map.locationDenied')}</Text>
          </View>
        ) : null}
      </View>

      <View className="bg-surface absolute bottom-0 left-0 right-0 gap-3 rounded-t-3xl px-4 pb-4 pt-4 shadow-sm">
        <View className="flex-row gap-2.5">
          <Pressable
            accessibilityRole="button"
            className="bg-lilac-tint flex-1 flex-row items-center gap-2.5 rounded-2xl px-3.5 py-3"
            onPress={() =>
              home
                ? startTrip(home)
                : router.push({ pathname: '/search', params: { intent: 'home' } })
            }
            style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
          >
            <House color={BRAND.amethyst} size={17} />
            <View className="flex-1">
              <Text className="text-ink text-sm" style={{ fontWeight: '700' }}>
                {t('map.home')}
              </Text>
              <Text className="text-muted text-[11px]" numberOfLines={1}>
                {home ? home.name : t('map.setHome')}
              </Text>
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            className="bg-lilac-tint flex-1 flex-row items-center gap-2.5 rounded-2xl px-3.5 py-3"
            onPress={() =>
              work
                ? startTrip(work)
                : router.push({ pathname: '/search', params: { intent: 'work' } })
            }
            style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
          >
            <Briefcase color={BRAND.amethyst} size={17} />
            <View className="flex-1">
              <Text className="text-ink text-sm" style={{ fontWeight: '700' }}>
                {t('map.work')}
              </Text>
              <Text className="text-muted text-[11px]" numberOfLines={1}>
                {work ? work.name : t('map.setWork')}
              </Text>
            </View>
          </Pressable>
        </View>

        <View className="bg-lilac-tint flex-row gap-1 rounded-2xl p-1">
          {(['walking', 'cycling', 'driving'] as const).map((option) => {
            const Icon = MODE_ICONS[option];
            const isSelected = option === mode;
            const label =
              option === 'walking'
                ? t('map.modeWalking')
                : option === 'cycling'
                  ? t('map.modeCycling')
                  : t('map.modeDriving');

            return (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                className={cn(
                  'flex-1 flex-row items-center justify-center gap-2 rounded-xl py-2.5',
                  isSelected ? 'bg-lilac' : 'bg-transparent',
                )}
                onPress={() => setMode(option)}
                style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
              >
                <Icon color={isSelected ? BRAND.ink : BRAND.muted} size={16} />
                <Text
                  className={cn('text-xs', isSelected ? 'text-ink' : 'text-muted')}
                  style={{ fontWeight: isSelected ? '700' : '500' }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          className="border-border flex-row items-center gap-3 rounded-2xl border px-4 py-3"
          onPress={() => router.push('/preferences')}
          style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
        >
          <View className="flex-1">
            <Text className="text-ink text-[13px]" style={{ fontWeight: '700' }}>
              {t('map.yourPreferences')}
            </Text>
            <Text className="text-ink-soft mt-0.5 text-[11px]" numberOfLines={1}>
              {preferenceSummary}
            </Text>
          </View>
          <ChevronRight color={BRAND.inkSoft} size={18} />
        </Pressable>
      </View>
    </View>
  );
}
