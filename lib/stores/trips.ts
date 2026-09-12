import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Place, RouteKind, TravelMode } from '@/lib/routing';

export interface SavedRoute {
  id: string;
  createdAt: string;
  mode: TravelMode;
  kind: RouteKind;
  origin: Place;
  destination: Place;
  durationSeconds: number;
  distanceMeters: number;
  tags: string[];
}

interface TripsState {
  home: Place | null;
  work: Place | null;
  recents: Place[];
  savedRoutes: SavedRoute[];

  setHome: (place: Place | null) => void;
  setWork: (place: Place | null) => void;
  addRecent: (place: Place) => void;
  clearRecents: () => void;
  saveRoute: (route: SavedRoute) => void;
  removeRoute: (id: string) => void;
}

const MAX_RECENTS = 8;

export const useTrips = create<TripsState>()(
  persist(
    (set) => ({
      home: null,
      work: null,
      recents: [],
      savedRoutes: [],

      setHome: (home) => set({ home }),
      setWork: (work) => set({ work }),
      addRecent: (place) =>
        set((state) => ({
          recents: [place, ...state.recents.filter((entry) => entry.id !== place.id)].slice(
            0,
            MAX_RECENTS,
          ),
        })),
      clearRecents: () => set({ recents: [] }),
      saveRoute: (route) =>
        set((state) => ({
          savedRoutes: [route, ...state.savedRoutes.filter((entry) => entry.id !== route.id)].slice(
            0,
            30,
          ),
        })),
      removeRoute: (id) =>
        set((state) => ({ savedRoutes: state.savedRoutes.filter((entry) => entry.id !== id) })),
    }),
    {
      name: 'safeway-trips',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);
