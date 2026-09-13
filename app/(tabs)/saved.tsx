import { Bookmark, Briefcase, Clock, House, MapPin, Trash2 } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { BRAND } from '@/lib/brand';
import { routeKindLabel } from '@/lib/labels';
import { formatDistance, formatDuration, type Place } from '@/lib/routing';
import { useSession } from '@/lib/stores/session';
import { useTrips } from '@/lib/stores/trips';

function SectionTitle({ title }: { title: string }) {
  return (
    <Text className="text-ink-soft mt-1 text-xs uppercase" style={{ letterSpacing: 1 }}>
      {title}
    </Text>
  );
}

export default function SavedScreen() {
  const { t } = useTranslation();
  const home = useTrips((state) => state.home);
  const work = useTrips((state) => state.work);
  const recents = useTrips((state) => state.recents);
  const savedRoutes = useTrips((state) => state.savedRoutes);
  const setHome = useTrips((state) => state.setHome);
  const setWork = useTrips((state) => state.setWork);
  const clearRecents = useTrips((state) => state.clearRecents);
  const removeRoute = useTrips((state) => state.removeRoute);
  const setOrigin = useSession((state) => state.setOrigin);
  const setDestination = useSession((state) => state.setDestination);

  const startTrip = (destination: Place, origin: Place | null = null) => {
    setOrigin(origin);
    setDestination(destination);
    router.push('/finding-routes');
  };

  return (
    <ScrollView
      className="bg-mist flex-1"
      contentContainerClassName="gap-3 px-4 pb-safe-offset-6 pt-2"
      showsVerticalScrollIndicator={false}
    >
      <SectionTitle title={t('saved.places')} />

      <View className="border-border bg-surface gap-1 rounded-2xl border p-2">
        <View
          className="flex-row items-center gap-3 rounded-xl px-2 py-3"
        >
          <Pressable
            accessibilityRole="button"
            className="flex-1 flex-row items-center gap-3"
            onPress={() =>
              home
                ? startTrip(home)
                : router.push({ pathname: '/search', params: { intent: 'home' } })
            }
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <View className="bg-lilac-tint h-9 w-9 items-center justify-center rounded-full">
              <House color={BRAND.amethyst} size={17} />
            </View>
            <View className="flex-1">
              <Text className="text-ink text-[15px]" style={{ fontWeight: '700' }}>
                {t('map.home')}
              </Text>
              <Text className="text-ink-soft text-xs" numberOfLines={1}>
                {home ? home.label : t('saved.setHome')}
              </Text>
            </View>
          </Pressable>
          {home ? (
            <Pressable
              accessibilityLabel={t('saved.removePlace')}
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setHome(null)}
            >
              <Trash2 color={BRAND.muted} size={16} />
            </Pressable>
          ) : null}
        </View>

        <View
          className="flex-row items-center gap-3 rounded-xl px-2 py-3"
        >
          <Pressable
            accessibilityRole="button"
            className="flex-1 flex-row items-center gap-3"
            onPress={() =>
              work
                ? startTrip(work)
                : router.push({ pathname: '/search', params: { intent: 'work' } })
            }
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <View className="bg-lilac-tint h-9 w-9 items-center justify-center rounded-full">
              <Briefcase color={BRAND.amethyst} size={17} />
            </View>
            <View className="flex-1">
              <Text className="text-ink text-[15px]" style={{ fontWeight: '700' }}>
                {t('map.work')}
              </Text>
              <Text className="text-ink-soft text-xs" numberOfLines={1}>
                {work ? work.label : t('saved.setWork')}
              </Text>
            </View>
          </Pressable>
          {work ? (
            <Pressable
              accessibilityLabel={t('saved.removePlace')}
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setWork(null)}
            >
              <Trash2 color={BRAND.muted} size={16} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {!home && !work ? (
        <Text className="text-ink-soft px-1 text-xs leading-4">{t('saved.noPlaces')}</Text>
      ) : null}

      <View className="mt-2 flex-row items-center justify-between">
        <SectionTitle title={t('saved.recent')} />
        {recents.length > 0 ? (
          <Pressable accessibilityRole="button" hitSlop={8} onPress={clearRecents}>
            <Text className="text-amethyst text-xs" style={{ fontWeight: '700' }}>
              {t('saved.clearRecents')}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {recents.length === 0 ? (
        <Text className="text-ink-soft px-1 text-xs leading-4">{t('search.searchHint')}</Text>
      ) : (
        <View className="border-border bg-surface gap-1 rounded-2xl border p-2">
          {recents.map((place) => (
            <Pressable
              key={place.id}
              accessibilityRole="button"
              className="flex-row items-center gap-3 rounded-xl px-2 py-3"
              onPress={() => startTrip(place)}
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            >
              <Clock color={BRAND.muted} size={16} />
              <View className="flex-1">
                <Text className="text-ink text-sm" style={{ fontWeight: '600' }}>
                  {place.name}
                </Text>
                <Text className="text-muted text-[11px]" numberOfLines={1}>
                  {place.label}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      <SectionTitle title={t('saved.routes')} />

      {savedRoutes.length === 0 ? (
        <Text className="text-ink-soft px-1 text-xs leading-4">{t('saved.noRoutes')}</Text>
      ) : (
        <View className="gap-2.5">
          {savedRoutes.map((route) => {
            const distance = formatDistance(route.distanceMeters);
            return (
              <View
                key={route.id}
                className="border-border bg-surface rounded-2xl border"
              >
                <Pressable
                  accessibilityRole="button"
                  className="gap-2 p-3.5 pr-10"
                  onPress={() => startTrip(route.destination, route.origin)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
                >
                <View className="flex-row items-start gap-2">
                  <Bookmark color={BRAND.amethyst} size={16} />
                  <View className="flex-1">
                    <Text className="text-ink text-sm" style={{ fontWeight: '700' }}>
                      {route.destination.name}
                    </Text>
                    <Text className="text-muted mt-0.5 text-[11px]" numberOfLines={1}>
                      <MapPin color={BRAND.muted} size={10} /> {route.origin.name}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-ink text-xs" style={{ fontWeight: '600' }}>
                    {routeKindLabel(t, route.kind)}
                  </Text>
                  <Text className="text-ink-soft text-xs">
                    {t('common.minutes', { count: formatDuration(route.durationSeconds) })} ·{' '}
                    {distance.value} {distance.unit}
                  </Text>
                </View>
                {route.tags.length > 0 ? (
                  <View className="flex-row flex-wrap gap-1.5">
                    {route.tags.map((tag) => (
                      <View key={tag} className="bg-lilac-tint rounded-full px-2.5 py-1">
                        <Text className="text-ink text-[10px]" style={{ fontWeight: '600' }}>
                          {t(`tags.${tag}`)}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                </Pressable>
                <Pressable
                  accessibilityLabel={t('common.remove')}
                  accessibilityRole="button"
                  className="absolute top-3.5 right-3.5"
                  hitSlop={8}
                  onPress={() => removeRoute(route.id)}
                >
                  <Trash2 color={BRAND.muted} size={16} />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
