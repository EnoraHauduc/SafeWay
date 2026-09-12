import { Clock, Lightbulb, ShieldAlert, Users, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { CtaButton } from '@/components/ui/CtaButton';
import { BRAND } from '@/lib/brand';
import { routeKindLabel } from '@/lib/labels';
import { goBackOrReplace } from '@/lib/navigation';
import { formatDistance, formatDuration } from '@/lib/routing';
import { pickRoute, useSession } from '@/lib/stores/session';

function Factor({
  icon,
  title,
  lines,
}: {
  icon: ReactNode;
  title: string;
  lines: (string | null)[];
}) {
  return (
    <View className="border-border bg-surface flex-row gap-3 rounded-2xl border p-4">
      <View className="bg-lilac-tint h-9 w-9 items-center justify-center rounded-full">{icon}</View>
      <View className="flex-1 gap-1">
        <Text className="text-ink text-[15px]" style={{ fontWeight: '700' }}>
          {title}
        </Text>
        {lines
          .filter((line): line is string => Boolean(line))
          .map((line) => (
            <Text key={line} className="text-ink-soft text-xs leading-5">
              {line}
            </Text>
          ))}
      </View>
    </View>
  );
}

export default function WhyRouteScreen() {
  const { t } = useTranslation();
  const response = useSession((state) => state.response);
  const selectedRouteId = useSession((state) => state.selectedRouteId);
  const startNavigation = useSession((state) => state.startNavigation);
  const route = pickRoute(response, selectedRouteId);

  if (!route) {
    return (
      <View className="bg-mist flex-1 items-center justify-center px-8">
        <Text className="text-ink text-center text-base">{t('routes.empty')}</Text>
      </View>
    );
  }

  const distance = formatDistance(route.distanceMeters);
  const deltaMinutes = Math.round(route.deltaSecondsVsFastest / 60);
  const activityLine =
    route.activityLevel === 'low'
      ? t('why.activityLow')
      : route.activityLevel === 'high'
        ? t('why.activityHigh')
        : t('why.activityModerate');

  return (
    <View className="bg-mist flex-1">
      <View className="flex-row items-center gap-3 px-4 pt-4">
        <View className="flex-1">
          <Text className="text-ink text-xl" style={{ fontWeight: '800' }}>
            {t('why.title')}
          </Text>
          <Text className="text-amethyst mt-0.5 text-xs" style={{ fontWeight: '600' }}>
            {routeKindLabel(t, route.kind)}
          </Text>
        </View>
        <Pressable
          accessibilityLabel={t('common.close')}
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => goBackOrReplace('/routes')}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <X color={BRAND.ink} size={22} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerClassName="gap-2.5 px-4 pb-6 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <Factor
          icon={<Lightbulb color={BRAND.amethyst} size={17} />}
          lines={[
            route.litShare === null
              ? t('why.lightingUnknown')
              : t('why.lightingBody', { value: Math.round(route.litShare * 100) }),
            route.avoidedUnlitAreas > 0
              ? t('why.lightingAvoided', { count: route.avoidedUnlitAreas })
              : null,
          ]}
          title={t('why.lightingTitle')}
        />

        <Factor
          icon={<Users color={BRAND.amethyst} size={17} />}
          lines={[
            activityLine,
            t('why.activityBody', {
              main: Math.round(route.mainRoadShare * 100),
              street: Math.round(route.streetShare * 100),
              path: Math.round(route.pathShare * 100),
            }),
          ]}
          title={t('why.activityTitle')}
        />

        <Factor
          icon={<Clock color={BRAND.amethyst} size={17} />}
          lines={[
            t('why.timeBody', {
              duration: formatDuration(route.durationSeconds),
              distance: (route.distanceMeters / 1000).toFixed(1),
            }),
            deltaMinutes <= 0 ? t('why.timeFastest') : t('why.timeDelta', { count: deltaMinutes }),
          ]}
          title={t('why.timeTitle')}
        />

        <Factor
          icon={<ShieldAlert color={BRAND.amethyst} size={17} />}
          lines={[t('why.matchBody', { value: Math.round(route.score * 100) })]}
          title={t('why.matchTitle')}
        />

        <View className="bg-lilac-tint rounded-2xl p-4">
          <Text className="text-ink-soft text-[11px] leading-5">{t('why.disclaimer')}</Text>
        </View>

        <Text className="text-muted px-1 text-[11px]">
          {distance.value} {distance.unit}
        </Text>
      </ScrollView>

      <View className="border-border bg-mist pb-safe-offset-3 border-t px-4 pt-3">
        <CtaButton
          label={t('why.cta')}
          onPress={() => {
            startNavigation(route.id);
            router.replace('/navigate');
          }}
          tone="lime"
        />
      </View>
    </View>
  );
}
