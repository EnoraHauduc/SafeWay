import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  ChevronLeft,
  Clock,
  MapPin,
  Navigation,
  Search,
} from 'lucide-react-native';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { BRAND } from '@/lib/brand';
import { goBackOrReplace } from '@/lib/navigation';
import { searchPlaces, type Place } from '@/lib/routing';
import { useSession } from '@/lib/stores/session';
import { useTrips } from '@/lib/stores/trips';
import { cn } from '@/lib/utils';

type Field = 'from' | 'to';

export default function SearchScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ intent?: string }>();
  const intent = params.intent === 'home' || params.intent === 'work' ? params.intent : null;

  const location = useSession((state) => state.location);
  const origin = useSession((state) => state.origin);
  const destination = useSession((state) => state.destination);
  const setOrigin = useSession((state) => state.setOrigin);
  const setDestination = useSession((state) => state.setDestination);
  const swapEnds = useSession((state) => state.swapEnds);
  const recents = useTrips((state) => state.recents);
  const addRecent = useTrips((state) => state.addRecent);
  const setHome = useTrips((state) => state.setHome);
  const setWork = useTrips((state) => state.setWork);

  const [field, setField] = useState<Field>('to');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  const focus = useMemo(() => location, [location]);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['places', debounced, focus.lat, focus.lng],
    queryFn: () => searchPlaces(debounced, focus),
    enabled: debounced.length >= 2,
  });

  const handleSelect = (place: Place) => {
    if (intent === 'home') {
      setHome(place);
      goBackOrReplace('/(tabs)');
      return;
    }
    if (intent === 'work') {
      setWork(place);
      goBackOrReplace('/(tabs)');
      return;
    }
    if (field === 'from') {
      setOrigin(place);
      setField('to');
      setQuery('');
      return;
    }
    setDestination(place);
    addRecent(place);
    router.push('/finding-routes');
  };

  const title =
    intent === 'home'
      ? t('saved.setHome')
      : intent === 'work'
        ? t('saved.setWork')
        : t('search.title');
  const showRecents = debounced.length < 2 && recents.length > 0 && !intent;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="bg-mist flex-1"
    >
      <View className="pt-safe-offset-2 flex-row items-center gap-3 px-4">
        <Pressable
          accessibilityLabel={t('common.back')}
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => goBackOrReplace('/(tabs)')}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <ChevronLeft color={BRAND.ink} size={26} />
        </Pressable>
        <Text className="text-ink flex-1 text-lg" style={{ fontWeight: '700' }}>
          {title}
        </Text>
      </View>

      <View className="gap-2.5 px-4 pt-4">
        {!intent ? (
          <View className="border-border bg-surface flex-row items-center gap-2 rounded-2xl border p-3">
            <View className="flex-1 gap-2">
              <Pressable
                accessibilityRole="button"
                className={cn(
                  'flex-row items-center gap-2.5 rounded-xl px-3 py-2.5',
                  field === 'from' ? 'bg-lilac-tint' : 'bg-transparent',
                )}
                onPress={() => {
                  setField('from');
                  setQuery('');
                }}
              >
                <Navigation color={BRAND.amethyst} size={15} />
                <View className="flex-1">
                  <Text className="text-muted text-[10px] uppercase" style={{ letterSpacing: 0.8 }}>
                    {t('search.from')}
                  </Text>
                  <Text
                    className="text-ink text-sm"
                    numberOfLines={1}
                    style={{ fontWeight: '600' }}
                  >
                    {origin ? origin.name : t('search.currentLocation')}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                className={cn(
                  'flex-row items-center gap-2.5 rounded-xl px-3 py-2.5',
                  field === 'to' ? 'bg-lilac-tint' : 'bg-transparent',
                )}
                onPress={() => {
                  setField('to');
                  setQuery('');
                }}
              >
                <MapPin color={BRAND.amethyst} size={15} />
                <View className="flex-1">
                  <Text className="text-muted text-[10px] uppercase" style={{ letterSpacing: 0.8 }}>
                    {t('search.to')}
                  </Text>
                  <Text
                    className={cn('text-sm', destination ? 'text-ink' : 'text-muted')}
                    numberOfLines={1}
                    style={{ fontWeight: '600' }}
                  >
                    {destination ? destination.name : t('search.toPlaceholder')}
                  </Text>
                </View>
              </Pressable>
            </View>

            <Pressable
              accessibilityLabel={t('search.from')}
              accessibilityRole="button"
              hitSlop={8}
              onPress={swapEnds}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <ArrowLeftRight color={BRAND.inkSoft} size={18} />
            </Pressable>
          </View>
        ) : null}

        <View className="border-border bg-surface flex-row items-center gap-3 rounded-2xl border px-4 py-3">
          <Search color={BRAND.amethyst} size={18} />
          <TextInput
            autoFocus
            className="text-ink flex-1 text-sm"
            onChangeText={setQuery}
            placeholder={
              field === 'from' && !intent ? t('search.fromPlaceholder') : t('search.toPlaceholder')
            }
            placeholderTextColor={BRAND.muted}
            returnKeyType="search"
            style={{ paddingVertical: 2 }}
            value={query}
          />
          {isFetching ? <ActivityIndicator color={BRAND.amethyst} size="small" /> : null}
        </View>
      </View>

      <ScrollView
        contentContainerClassName="gap-1 px-4 pb-safe-offset-6 pt-3"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {field === 'from' && !intent ? (
          <Pressable
            accessibilityRole="button"
            className="border-border bg-surface mb-2 flex-row items-center gap-3 rounded-2xl border px-4 py-3.5"
            onPress={() => {
              setOrigin(null);
              setField('to');
              setQuery('');
            }}
            style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
          >
            <Navigation color={BRAND.amethyst} size={16} />
            <Text className="text-ink flex-1 text-sm" style={{ fontWeight: '600' }}>
              {t('search.currentLocation')}
            </Text>
          </Pressable>
        ) : null}

        {showRecents ? (
          <>
            <Text
              className="text-ink-soft mb-1 px-1 text-xs uppercase"
              style={{ letterSpacing: 1 }}
            >
              {t('search.recent')}
            </Text>
            {recents.map((place) => (
              <Pressable
                key={place.id}
                accessibilityRole="button"
                className="border-border bg-surface flex-row items-center gap-3 rounded-2xl border px-4 py-3"
                onPress={() => handleSelect(place)}
                style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
              >
                <Clock color={BRAND.muted} size={15} />
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
          </>
        ) : null}

        {debounced.length >= 2 && results.length === 0 && !isFetching ? (
          <Text className="text-ink-soft px-1 py-2 text-xs">{t('search.noResults')}</Text>
        ) : null}

        {results.map((place) => (
          <Pressable
            key={place.id}
            accessibilityRole="button"
            className="border-border bg-surface flex-row items-center gap-3 rounded-2xl border px-4 py-3"
            onPress={() => handleSelect(place)}
            style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
          >
            <MapPin color={BRAND.amethyst} size={15} />
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

        {debounced.length < 2 && !showRecents ? (
          <Text className="text-ink-soft px-1 py-2 text-xs">{t('search.searchHint')}</Text>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
