import { useEffect, useMemo, useRef } from 'react';
import { Briefcase, House, Moon, Search } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Switch } from 'heroui-native';
import { useTranslation } from 'react-i18next';

import MapView from '@/components/MapView';
import { zoomToRegion, type MapMarker, type MapViewHandle } from '@/components/MapView.types';
import { SafeWayLogo } from '@/components/SafeWayLogo';
import { useNightMode } from '@/hooks/useNightMode';
import { BRAND } from '@/lib/brand';
import { usePreferences } from '@/lib/stores/preferences';
import { useSession } from '@/lib/stores/session';
import { useTrips } from '@/lib/stores/trips';

export default function MapScreen() {
  const { t } = useTranslation();
  const location = useSession((state) => state.location);
  const locationStatus = useSession((state) => state.locationStatus);
  const setOrigin = useSession((state) => state.setOrigin);
  const setDestination = useSession((state) => state.setDestination);
  const home = useTrips((state) => state.home);
  const work = useTrips((state) => state.work);
  const setNightOverride = usePreferences((state) => state.setNightOverride);
  const autoNightMode = usePreferences((state) => state.autoNightMode);
  const night = useNightMode();
  const mapRef = useRef<MapViewHandle>(null);

  // Flipping the toggle back to what auto detection would say hands control back to auto.
  const handleNightToggle = (next: boolean) => {
    setNightOverride(autoNightMode && next === night.afterSunset ? null : next);
  };

  const region = useMemo(
    () => zoomToRegion({ latitude: location.lat, longitude: location.lng }, 14),
    [location],
  );

  useEffect(() => {
    if (locationStatus === 'granted') {
      mapRef.current?.animateToRegion(region, 350);
    }
  }, [locationStatus, region]);

  const markers = useMemo<MapMarker[]>(() => {
    const list: MapMarker[] = [];
    if (locationStatus === 'granted') {
      list.push({
        id: 'me',
        coordinate: { latitude: location.lat, longitude: location.lng },
        title: t('map.yourLocation'),
        color: BRAND.amethyst,
      });
    }
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
  }, [home, location, locationStatus, t, work]);

  const openSavedPlace = (place: typeof home, intent: 'home' | 'work') => {
    if (!place) {
      router.push({ pathname: '/search', params: { intent } });
      return;
    }

    setOrigin(null);
    setDestination(place);
    router.push('/finding-routes');
  };

  return (
    <View className="bg-mist flex-1">
      <MapView
        ref={mapRef}
        className="absolute inset-0"
        initialRegion={region}
        markers={markers}
        circles={
          locationStatus === 'granted'
            ? [
                {
                  id: 'current-location-accuracy',
                  center: { latitude: location.lat, longitude: location.lng },
                  radius: 120,
                  strokeColor: BRAND.amethyst,
                  strokeWidth: 3,
                  fillColor: 'rgba(98, 68, 212, 0.18)',
                },
              ]
            : []
        }
        showsCompass={false}
        showsMyLocationButton={false}
        showsPointsOfInterest={false}
        showsScale={false}
        showsUserLocation={locationStatus === 'granted'}
        style={{ flex: 1 }}
      />

      <View className="pt-safe-offset-2 absolute top-0 right-0 left-0 gap-2.5 px-4">
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
              onSelectedChange={handleNightToggle}
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
      </View>

      <View className="absolute right-4 bottom-4 left-4 flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          className="border-border bg-surface flex-1 flex-row items-center gap-3 rounded-2xl border px-4 py-3.5"
          onPress={() => openSavedPlace(home, 'home')}
          style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
        >
          <House color={BRAND.amethyst} size={18} />
          <Text className="text-ink flex-1 text-sm" numberOfLines={1} style={{ fontWeight: '700' }}>
            {home ? t('map.home') : t('map.setHome')}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          className="border-border bg-surface flex-1 flex-row items-center gap-3 rounded-2xl border px-4 py-3.5"
          onPress={() => openSavedPlace(work, 'work')}
          style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
        >
          <Briefcase color={BRAND.amethyst} size={18} />
          <Text className="text-ink flex-1 text-sm" numberOfLines={1} style={{ fontWeight: '700' }}>
            {work ? t('map.work') : t('map.setWork')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
