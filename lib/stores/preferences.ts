import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { setLanguage, type Language, deviceLanguage } from '@/lib/i18n';
import type {
  ActivityPreference,
  LightingPreference,
  StreetPreference,
  TravelMode,
} from '@/lib/routing';

export type RouteFeel = 'park' | 'main';
export type TransitImportance = 'not' | 'somewhat' | 'very';

export interface TrustedContact {
  name: string;
  contact: string;
}

interface PreferencesState {
  language: Language;
  onboardingComplete: boolean;
  routeFeel: RouteFeel;
  activity: ActivityPreference;
  lighting: LightingPreference;
  streetType: StreetPreference;
  autoNightMode: boolean;
  /** null = follow auto night mode, true/false = manual override from the map toggle. */
  nightOverride: boolean | null;
  transitImportance: TransitImportance;
  extraTimeMinutes: number;
  mode: TravelMode;
  trustedContact: TrustedContact | null;

  setLanguage: (language: Language) => void;
  setRouteFeel: (feel: RouteFeel) => void;
  setActivity: (activity: ActivityPreference) => void;
  setLighting: (lighting: LightingPreference) => void;
  setStreetType: (streetType: StreetPreference) => void;
  setAutoNightMode: (enabled: boolean) => void;
  setNightOverride: (value: boolean | null) => void;
  setTransitImportance: (importance: TransitImportance) => void;
  setExtraTimeMinutes: (minutes: number) => void;
  setMode: (mode: TravelMode) => void;
  setTrustedContact: (contact: TrustedContact | null) => void;
  completeOnboarding: () => void;
  restartOnboarding: () => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      language: deviceLanguage(),
      onboardingComplete: false,
      routeFeel: 'main',
      activity: 'moderate',
      lighting: 'prefer_lit',
      streetType: 'main',
      autoNightMode: true,
      nightOverride: null,
      transitImportance: 'somewhat',
      extraTimeMinutes: 5,
      mode: 'walking',
      trustedContact: null,

      setLanguage: (language) => {
        setLanguage(language);
        set({ language });
      },
      setRouteFeel: (routeFeel) =>
        set((state) => ({
          routeFeel,
          // "Through a park" opens up paths, "Main streets" pins the street type.
          streetType:
            routeFeel === 'main' ? 'main' : state.streetType === 'main' ? 'none' : state.streetType,
        })),
      setActivity: (activity) => set({ activity }),
      setLighting: (lighting) => set({ lighting }),
      setStreetType: (streetType) => set({ streetType }),
      setAutoNightMode: (autoNightMode) => set({ autoNightMode }),
      setNightOverride: (nightOverride) => set({ nightOverride }),
      setTransitImportance: (transitImportance) => set({ transitImportance }),
      setExtraTimeMinutes: (extraTimeMinutes) => set({ extraTimeMinutes }),
      setMode: (mode) => set({ mode }),
      setTrustedContact: (trustedContact) => set({ trustedContact }),
      completeOnboarding: () => set({ onboardingComplete: true }),
      restartOnboarding: () => set({ onboardingComplete: false }),
    }),
    {
      name: 'safeway-preferences',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (state?.language) setLanguage(state.language);
      },
    },
  ),
);

/** True once persisted preferences have been read, so we can gate the first route. */
export function usePreferencesHydrated() {
  return useSyncExternalStore(
    (onStoreChange) => usePreferences.persist.onFinishHydration(onStoreChange),
    () => usePreferences.persist.hasHydrated(),
  );
}
