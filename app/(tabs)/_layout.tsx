import { Bookmark, Map as MapIcon, User } from 'lucide-react-native';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

import { BRAND } from '@/lib/brand';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: BRAND.mist },
          headerTintColor: BRAND.ink,
          headerTitleStyle: { color: BRAND.ink, fontWeight: '700' },
          headerShadowVisible: false,
          sceneStyle: { backgroundColor: BRAND.mist },
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: '#E5DFF3',
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarActiveTintColor: BRAND.amethyst,
          tabBarInactiveTintColor: BRAND.muted,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('tabs.map'),
            headerShown: false,
            tabBarIcon: ({ color, size }) => <MapIcon color={color} size={size ?? 24} />,
          }}
        />
        <Tabs.Screen
          name="saved"
          options={{
            title: t('saved.title'),
            tabBarLabel: t('tabs.saved'),
            tabBarIcon: ({ color, size }) => <Bookmark color={color} size={size ?? 24} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('profile.title'),
            tabBarLabel: t('tabs.profile'),
            tabBarIcon: ({ color, size }) => <User color={color} size={size ?? 24} />,
          }}
        />
      </Tabs>
    </>
  );
}
