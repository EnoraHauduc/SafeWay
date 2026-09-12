import { create } from 'zustand';

import { HAMBURG_CENTER, requestCurrentPosition, type Coordinates, type LocationStatus } from '@/lib/location';
import {
  findRoutes,
  RoutingError,
  type Place,
  type RoutePrefs,
  type RouteOption,
  type RoutesResponse,
  type TravelMode,
} from '@/lib/routing';

type SearchStatus = 'idle' | 'searching' | 'ready' | 'error';

interface SessionState {
  location: Coordinates;
  locationStatus: LocationStatus;
  /** null means "start from my current location". */
  origin: Place | null;
  destination: Place | null;
  status: SearchStatus;
  errorCode: string | null;
  response: RoutesResponse | null;
  selectedRouteId: string | null;
  activeRouteId: string | null;
  requestId: number;

  initLocation: () => Promise<void>;
  setOrigin: (place: Place | null) => void;
  setDestination: (place: Place | null) => void;
  swapEnds: () => void;
  search: (args: { mode: TravelMode; prefs: RoutePrefs; language: string }) => Promise<boolean>;
  selectRoute: (id: string) => void;
  startNavigation: (id: string) => void;
  endNavigation: () => void;
  clearRoutes: () => void;
}

export const useSession = create<SessionState>()((set, get) => ({
  location: HAMBURG_CENTER,
  locationStatus: 'idle',
  origin: null,
  destination: null,
  status: 'idle',
  errorCode: null,
  response: null,
  selectedRouteId: null,
  activeRouteId: null,
  requestId: 0,

  initLocation: async () => {
    const result = await requestCurrentPosition();
    set({ location: result.coords, locationStatus: result.status });
  },

  setOrigin: (origin) => set({ origin }),
  setDestination: (destination) => set({ destination }),
  swapEnds: () => {
    const { origin, destination, location } = get();
    if (!destination) return;
    const currentAsPlace: Place = origin ?? {
      id: 'current-location',
      name: 'current-location',
      label: 'current-location',
      locality: null,
      lat: location.lat,
      lng: location.lng,
    };
    set({ origin: destination, destination: currentAsPlace });
  },

  search: async ({ mode, prefs, language }) => {
    const { origin, destination, location, requestId } = get();
    if (!destination) {
      set({ status: 'error', errorCode: 'destination_not_found' });
      return false;
    }

    const nextId = requestId + 1;
    set({ requestId: nextId, status: 'searching', errorCode: null, response: null, selectedRouteId: null });

    try {
      const response = await findRoutes({
        origin: origin ? { lat: origin.lat, lng: origin.lng } : location,
        destination: { lat: destination.lat, lng: destination.lng },
        mode,
        prefs,
        language,
      });

      if (get().requestId !== nextId) return false;

      if (response.options.length === 0) {
        set({ status: 'error', errorCode: 'routing_failed' });
        return false;
      }

      set({
        status: 'ready',
        response,
        selectedRouteId: response.options[0].id,
      });
      return true;
    } catch (error) {
      if (get().requestId !== nextId) return false;
      const code = error instanceof RoutingError ? error.code : 'generic';
      set({ status: 'error', errorCode: code });
      return false;
    }
  },

  selectRoute: (selectedRouteId) => set({ selectedRouteId }),
  startNavigation: (activeRouteId) => set({ activeRouteId, selectedRouteId: activeRouteId }),
  endNavigation: () => set({ activeRouteId: null }),
  clearRoutes: () =>
    set({ status: 'idle', response: null, errorCode: null, selectedRouteId: null, activeRouteId: null }),
}));

export function pickRoute(response: RoutesResponse | null, id: string | null): RouteOption | null {
  if (!response) return null;
  return response.options.find((option) => option.id === id) ?? response.options[0] ?? null;
}
