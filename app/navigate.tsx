import { useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, Footprints, Share2, Square } from 'lucide-react-native';
import { Pressable, ScrollView, Share, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import MapView from '@/components/MapView';
import type { MapViewHandle } from '@/components/MapView.types';
import { BRAND, ROUTE_COLORS } from '@/lib/brand';
import { routeKindLabel } from '@/lib/labels';
import { goBackOrReplace } from '@/lib/navigation';
import { formatDistance, formatDuration } from '@/lib/routing';
import { usePreferences } from '@/lib/stores/preferences';
import { pickRoute, useSession } from '@/lib/stores/session';

export default function NavigateScreen() {
  const { t } = useTranslation();
  const mapRef = useRef<MapViewHandle>(null);

  const response = useSession((state) => state.response);
  const activeRouteId = useSession((state) => state.activeRouteId);
  const endNavigation = useSession((state) => state.endNavigation);
  const destination = useSession((state) => state.destination);
  const trustedContact = usePreferences((state) => state.trustedContact);

  const route = pickRoute(response, activeRouteId);

  const polylines = useMemo(
    () =>
      route
        ? [
            {
              id: route.id,
              coordinates: route.geometry,
              strokeColor: ROUTE_COLORS[route.kind],
              strokeWidth: 6,
            },
          ]
        : [],
    [route],
  );

  useEffect(() => {
    if (!route || route.geometry.length < 2) return;
    mapRef.current?.fitToCoordinates(route.geometry, {
      animated: true,
      edgePadding: { top: 80, right: 40, bottom: 40, left: 40 },
    });
  }, [route]);

  if (!route || !response) {
    return (
      <View className="bg-mist flex-1 items-center justify-center px-8">
        <Text className="text-ink text-center text-base">{t('routes.empty')}</Text>
      </View>
    );
  }

  const destinationName = destination?.name ?? response.destination.label ?? t('search.to');

  const shareTrip = async () => {
    if (!trustedContact) {
      router.push('/trusted-contact');
      return;
    }
    await Share.share({
      message: t('navigate.shareMessage', {
        name: trustedContact.name,
        destination: destinationName,
        minutes: formatDuration(route.durationSeconds),
      }),
    });
  };

  return (
    <View className="bg-mist flex-1">
      <View style={{ height: 300 }}>
        <MapView
          ref={mapRef}
          markers={[
            {
              id: 'start',
              coordinate: { latitude: response.origin.lat, longitude: response.origin.lng },
              color: BRAND.lilac,
            },
            {
              id: 'end',
              coordinate: {
                latitude: response.destination.lat,
                longitude: response.destination.lng,
              },
              title: destinationName,
              color: BRAND.amethyst,
            },
          ]}
          polylines={polylines}
          showsCompass={false}
          showsPointsOfInterest={false}
          showsScale={false}
          showsUserLocation
          style={{ flex: 1 }}
        />
        <Pressable
          accessibilityLabel={t('common.back')}
          accessibilityRole="button"
          className="bg-surface top-safe-offset-2 absolute left-4 h-10 w-10 items-center justify-center rounded-full"
          onPress={() => goBackOrReplace('/routes')}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <ChevronLeft color={BRAND.ink} size={22} />
        </Pressable>
      </View>

      <View className="bg-surface -mt-5 flex-1 rounded-t-3xl px-4 pt-4">
        <View className="flex-row items-center gap-3">
          <View className="bg-lilac-tint h-10 w-10 items-center justify-center rounded-full">
            <Footprints color={BRAND.amethyst} size={18} />
          </View>
          <View className="flex-1">
            <Text className="text-ink text-base" style={{ fontWeight: '800' }}>
              {t('navigate.arriveAt', { destination: destinationName })}
            </Text>
            <Text className="text-ink-soft mt-0.5 text-xs">
              {t('navigate.remaining', {
                duration: formatDuration(route.durationSeconds),
                distance: (route.distanceMeters / 1000).toFixed(1),
              })}{' '}
              · {routeKindLabel(t, route.kind)}
            </Text>
          </View>
        </View>

        <Text className="text-ink-soft mt-4 text-xs uppercase" style={{ letterSpacing: 1 }}>
          {t('navigate.steps')}
        </Text>

        <ScrollView
          className="mt-2 flex-1"
          contentContainerClassName="gap-1 pb-4"
          showsVerticalScrollIndicator={false}
        >
          {route.steps.map((step, index) => {
            const stepDistance = formatDistance(step.distanceMeters);
            return (
              <View
                key={`${step.instruction}-${step.location.latitude}-${step.location.longitude}-${step.distanceMeters}`}
                className="border-separator flex-row items-start gap-3 border-b py-3"
              >
                <Text className="text-muted w-5 text-xs" style={{ fontWeight: '700' }}>
                  {index + 1}
                </Text>
                <View className="flex-1">
                  <Text className="text-ink text-sm leading-5" style={{ fontWeight: '600' }}>
                    {step.instruction}
                  </Text>
                  {step.name ? (
                    <Text className="text-muted mt-0.5 text-[11px]">{step.name}</Text>
                  ) : null}
                </View>
                <Text className="text-ink-soft text-[11px]">
                  {stepDistance.value} {stepDistance.unit}
                </Text>
              </View>
            );
          })}
          <Text className="text-muted mt-3 text-[11px] leading-4">{t('why.disclaimer')}</Text>
        </ScrollView>

        <View className="pb-safe-offset-3 flex-row gap-2.5 pt-1">
          <Pressable
            accessibilityRole="button"
            className="bg-lilac-tint h-12 flex-1 flex-row items-center justify-center gap-2 rounded-2xl"
            onPress={() => void shareTrip()}
            style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
          >
            <Share2 color={BRAND.ink} size={16} />
            <Text className="text-ink text-sm" style={{ fontWeight: '700' }} numberOfLines={1}>
              {trustedContact
                ? t('navigate.shareTrip', { name: trustedContact.name })
                : t('navigate.noContact')}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            className="bg-ink h-12 flex-row items-center justify-center gap-2 rounded-2xl px-4"
            onPress={() => {
              endNavigation();
              goBackOrReplace('/(tabs)');
            }}
            style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
          >
            <Square color={BRAND.white} size={14} />
            <Text className="text-sm text-white" style={{ fontWeight: '700' }}>
              {t('navigate.endRoute')}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
