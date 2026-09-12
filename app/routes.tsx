import { useEffect, useMemo, useRef } from 'react';
import { Bookmark, BookmarkCheck, ChevronLeft, Info, RefreshCw } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import MapView from '@/components/MapView';
import type { MapPolyline, MapViewHandle } from '@/components/MapView.types';
import { CtaButton } from '@/components/ui/CtaButton';
import { useNightMode } from '@/hooks/useNightMode';
import { BRAND, ROUTE_COLORS } from '@/lib/brand';
import { routeKindLabel } from '@/lib/labels';
import { goBackOrReplace } from '@/lib/navigation';
import { effectivePrefs, formatDistance, formatDuration, type RouteOption } from '@/lib/routing';
import { usePreferences } from '@/lib/stores/preferences';
import { pickRoute, useSession } from '@/lib/stores/session';
import { useTrips } from '@/lib/stores/trips';
import { cn } from '@/lib/utils';

export default function RoutesScreen() {
  const { t } = useTranslation();
  const mapRef = useRef<MapViewHandle>(null);

  const response = useSession((state) => state.response);
  const status = useSession((state) => state.status);
  const selectedRouteId = useSession((state) => state.selectedRouteId);
  const selectRoute = useSession((state) => state.selectRoute);
  const startNavigation = useSession((state) => state.startNavigation);
  const search = useSession((state) => state.search);
  const destination = useSession((state) => state.destination);
  const origin = useSession((state) => state.origin);

  const savedRoutes = useTrips((state) => state.savedRoutes);
  const saveRoute = useTrips((state) => state.saveRoute);

  const mode = usePreferences((state) => state.mode);
  const lighting = usePreferences((state) => state.lighting);
  const streetType = usePreferences((state) => state.streetType);
  const activity = usePreferences((state) => state.activity);
  const extraTimeMinutes = usePreferences((state) => state.extraTimeMinutes);
  const language = usePreferences((state) => state.language);
  const night = useNightMode();

  const selected = pickRoute(response, selectedRouteId);

  const polylines = useMemo<MapPolyline[]>(() => {
    if (!response) return [];
    return response.options.map((option) => ({
      id: option.id,
      coordinates: option.geometry,
      strokeColor: option.id === selected?.id ? ROUTE_COLORS[option.kind] : ROUTE_COLORS.inactive,
      strokeWidth: option.id === selected?.id ? 5 : 3,
    }));
  }, [response, selected]);

  useEffect(() => {
    if (!selected || selected.geometry.length < 2) return;
    mapRef.current?.fitToCoordinates(selected.geometry, {
      animated: true,
      edgePadding: { top: 60, right: 40, bottom: 60, left: 40 },
    });
  }, [selected]);

  const currentPrefs = effectivePrefs(
    { lighting, streetType, activity, extraTimeMinutes },
    night.isNight,
  );

  const isStale = Boolean(
    response &&
    (response.mode !== mode ||
      response.prefs.lighting !== currentPrefs.lighting ||
      response.prefs.streetType !== currentPrefs.streetType ||
      response.prefs.activity !== currentPrefs.activity ||
      response.prefs.isNight !== currentPrefs.isNight ||
      response.prefs.extraTimeMinutes !== currentPrefs.extraTimeMinutes),
  );

  const refresh = () => {
    void search({ mode, prefs: currentPrefs, language });
  };

  if (!response) {
    return (
      <View className="bg-mist flex-1 items-center justify-center gap-4 px-8">
        <Text className="text-ink text-center text-base">{t('routes.empty')}</Text>
        <CtaButton
          label={t('common.back')}
          onPress={() => goBackOrReplace('/(tabs)')}
          tone="lilac"
        />
      </View>
    );
  }

  const renderCard = (option: RouteOption) => {
    const isSelected = option.id === selected?.id;
    const distance = formatDistance(option.distanceMeters);
    const deltaMinutes = Math.round(option.deltaSecondsVsFastest / 60);
    const isSaved = savedRoutes.some((route) => route.id === option.id);

    return (
      <Pressable
        key={option.id}
        accessibilityRole="radio"
        accessibilityState={{ selected: isSelected }}
        className={cn(
          'gap-2.5 rounded-2xl border p-4',
          isSelected ? 'border-amethyst bg-surface' : 'border-border bg-surface',
        )}
        onPress={() => selectRoute(option.id)}
        style={({ pressed }) => ({ opacity: pressed ? 0.95 : 1 })}
      >
        <View className="flex-row items-center gap-2">
          <View
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: ROUTE_COLORS[option.kind] }}
          />
          <Text className="text-ink flex-1 text-[15px]" style={{ fontWeight: '700' }}>
            {routeKindLabel(t, option.kind)}
          </Text>
          <Pressable
            accessibilityLabel={t('routes.saveRoute')}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => {
              if (!destination) return;
              saveRoute({
                id: option.id,
                createdAt: new Date().toISOString(),
                mode: response.mode,
                kind: option.kind,
                origin: origin ?? {
                  id: 'current-location',
                  name: t('search.currentLocation'),
                  label: t('search.currentLocation'),
                  locality: null,
                  lat: response.origin.lat,
                  lng: response.origin.lng,
                },
                destination,
                durationSeconds: option.durationSeconds,
                distanceMeters: option.distanceMeters,
                tags: option.tags,
              });
            }}
          >
            {isSaved ? (
              <BookmarkCheck color={BRAND.amethyst} size={18} />
            ) : (
              <Bookmark color={BRAND.muted} size={18} />
            )}
          </Pressable>
        </View>

        <View className="flex-row items-end gap-2">
          <Text className="text-ink text-2xl" style={{ fontWeight: '800' }}>
            {t('common.minutes', { count: formatDuration(option.durationSeconds) })}
          </Text>
          <Text className="text-ink-soft pb-1 text-sm">
            {distance.value} {distance.unit}
          </Text>
          <Text className="text-muted flex-1 pb-1 text-right text-xs">
            {deltaMinutes <= 0
              ? t('routes.sameAsFastest')
              : t('routes.slower', { count: deltaMinutes })}
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-1.5">
          {option.tags.map((tag) => (
            <View key={tag} className="bg-lilac-tint rounded-full px-2.5 py-1">
              <Text className="text-ink text-[10px]" style={{ fontWeight: '600' }}>
                {t(`tags.${tag}`)}
              </Text>
            </View>
          ))}
        </View>

        <Text className="text-ink-soft text-xs">
          {option.litShare === null
            ? t('routes.litUnknown')
            : t('routes.litShare', { value: Math.round(option.litShare * 100) })}
        </Text>

        {isSelected ? (
          <View className="mt-1 gap-2">
            <Pressable
              accessibilityRole="button"
              className="border-border flex-row items-center justify-center gap-2 rounded-xl border py-2.5"
              onPress={() => {
                selectRoute(option.id);
                router.push('/why-route');
              }}
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            >
              <Info color={BRAND.amethyst} size={15} />
              <Text className="text-amethyst text-sm" style={{ fontWeight: '700' }}>
                {t('routes.why')}
              </Text>
            </Pressable>
            <CtaButton
              label={t('routes.useRoute')}
              onPress={() => {
                startNavigation(option.id);
                router.push('/navigate');
              }}
              size="md"
              tone="lime"
            />
          </View>
        ) : null}
      </Pressable>
    );
  };

  return (
    <View className="bg-mist flex-1">
      <View style={{ height: 260 }}>
        <MapView
          ref={mapRef}
          markers={[
            {
              id: 'start',
              coordinate: { latitude: response.origin.lat, longitude: response.origin.lng },
              title: t('search.from'),
              color: BRAND.lilac,
            },
            {
              id: 'end',
              coordinate: {
                latitude: response.destination.lat,
                longitude: response.destination.lng,
              },
              title: t('search.to'),
              color: BRAND.amethyst,
            },
          ]}
          polylines={polylines}
          showsCompass={false}
          showsMyLocationButton={false}
          showsPointsOfInterest={false}
          showsScale={false}
          style={{ flex: 1 }}
        />
        <Pressable
          accessibilityLabel={t('common.back')}
          accessibilityRole="button"
          className="bg-surface top-safe-offset-2 absolute left-4 h-10 w-10 items-center justify-center rounded-full"
          onPress={() => goBackOrReplace('/(tabs)')}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <ChevronLeft color={BRAND.ink} size={22} />
        </Pressable>
      </View>

      <ScrollView
        className="-mt-5"
        contentContainerClassName="gap-3 px-4 pb-safe-offset-6 pt-5"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-1">
          <Text className="text-ink text-[22px] leading-7" style={{ fontWeight: '800' }}>
            {t('routes.title')}
          </Text>
          <Text className="text-ink-soft text-xs">{t('routes.subtitle')}</Text>
        </View>

        {isStale ? (
          <Pressable
            accessibilityRole="button"
            className="bg-ink flex-row items-center justify-center gap-2 rounded-2xl px-4 py-3"
            onPress={refresh}
            style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
          >
            <RefreshCw color={BRAND.white} size={15} />
            <Text className="text-sm text-white" style={{ fontWeight: '700' }}>
              {status === 'searching' ? t('routes.findingTitle') : t('prefs.saveCta')}
            </Text>
          </Pressable>
        ) : null}

        {response.options.map(renderCard)}

        {response.meta.notes.length > 0 ? (
          <View className="bg-lilac-tint gap-1 rounded-2xl p-3.5">
            {response.meta.notes.map((note) => (
              <Text key={note} className="text-ink-soft text-[11px] leading-4">
                {t(`notes.${note}`, { defaultValue: note })}
              </Text>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
