import { bilt } from '@/lib/bilt';
import type { Coordinates } from '@/lib/location';

export interface Place {
  id: string;
  name: string;
  label: string;
  locality: string | null;
  lat: number;
  lng: number;
}

export type TravelMode = 'walking' | 'cycling' | 'driving';
export type LightingPreference = 'prefer_lit' | 'avoid_unlit' | 'none';
export type StreetPreference = 'residential' | 'main' | 'avoid_isolated' | 'none';
export type ActivityPreference = 'quiet' | 'moderate' | 'busy';
export type RouteKind = 'recommended' | 'quieter' | 'fastest';

export interface RoutePrefs {
  lighting: LightingPreference;
  streetType: StreetPreference;
  activity: ActivityPreference;
  isNight: boolean;
  extraTimeMinutes: number;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface RouteStep {
  instruction: string;
  name: string | null;
  distanceMeters: number;
  durationSeconds: number;
  location: RoutePoint;
}

export interface RouteOption {
  id: string;
  kind: RouteKind;
  durationSeconds: number;
  distanceMeters: number;
  deltaSecondsVsFastest: number;
  score: number;
  litShare: number | null;
  lightingCoverage: number;
  activityIndex: number;
  activityLevel: 'low' | 'moderate' | 'high';
  mainRoadShare: number;
  streetShare: number;
  pathShare: number;
  greenIndex: number | null;
  noiseIndex: number | null;
  avoidedUnlitAreas: number;
  tags: string[];
  geometry: RoutePoint[];
  steps: RouteStep[];
}

export interface RoutesResponse {
  options: RouteOption[];
  origin: Coordinates;
  destination: Coordinates & { label: string | null };
  mode: TravelMode;
  prefs: RoutePrefs;
  meta: {
    notes: string[];
    lightingSamples: number;
    tilesFromCache: number;
    tilesFetched: number;
    avoidCells: number;
    candidateCount: number;
  };
}

export class RoutingError extends Error {
  code: string;

  constructor(code: string) {
    super(code);
    this.name = 'RoutingError';
    this.code = code;
  }
}

async function readErrorCode(error: unknown): Promise<string> {
  const context =
    typeof error === 'object' && error !== null && 'context' in error ? error.context : undefined;
  if (context instanceof Response) {
    try {
      const payload: unknown = await context.json();
      if (
        typeof payload === 'object' &&
        payload !== null &&
        'error' in payload &&
        typeof payload.error === 'string'
      ) {
        return payload.error;
      }
    } catch {
      // fall through to the generic code
    }
  }
  if (error instanceof Error && error.message.includes('Failed to fetch')) return 'network';
  return 'generic';
}

async function invoke<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await bilt.functions.invoke<T>(name, { body });
  if (error) throw new RoutingError(await readErrorCode(error));
  if (!data) throw new RoutingError('generic');
  return data;
}

export async function searchPlaces(
  text: string,
  focus?: Coordinates,
  signal?: AbortSignal,
): Promise<Place[]> {
  if (text.trim().length < 2) return [];
  const result = await invoke<{ places: Place[] }>('safeway-geocode', {
    mode: 'autocomplete',
    text,
    focus,
    size: 8,
  });
  if (signal?.aborted) return [];
  return result.places;
}

export async function reverseGeocode(point: Coordinates): Promise<Place | null> {
  try {
    const result = await invoke<{ places: Place[] }>('safeway-geocode', {
      mode: 'reverse',
      point,
      size: 1,
    });
    return result.places[0] ?? null;
  } catch {
    return null;
  }
}

export interface FindRoutesInput {
  origin: Coordinates;
  destination?: Coordinates;
  destinationQuery?: string;
  mode: TravelMode;
  prefs: RoutePrefs;
  language: string;
}

export function findRoutes(input: FindRoutesInput): Promise<RoutesResponse> {
  return invoke<RoutesResponse>('safeway-routes', { ...input });
}

export function effectivePrefs(
  prefs: {
    lighting: LightingPreference;
    streetType: StreetPreference;
    activity: ActivityPreference;
    extraTimeMinutes: number;
  },
  isNight: boolean,
): RoutePrefs {
  return {
    // At night a soft "prefer lit" becomes a hard "avoid unlit".
    lighting: isNight && prefs.lighting === 'prefer_lit' ? 'avoid_unlit' : prefs.lighting,
    streetType: prefs.streetType,
    activity: prefs.activity,
    isNight,
    extraTimeMinutes: prefs.extraTimeMinutes,
  };
}

export function formatDuration(seconds: number) {
  return Math.max(1, Math.round(seconds / 60));
}

export function formatDistance(meters: number) {
  if (meters < 950) return { value: String(Math.round(meters / 10) * 10), unit: 'm' as const };
  return { value: (meters / 1000).toFixed(1), unit: 'km' as const };
}
