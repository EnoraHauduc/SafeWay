import * as Location from 'expo-location';

export const HAMBURG_CENTER = { lat: 53.5511, lng: 9.9937 };

export interface Coordinates {
  lat: number;
  lng: number;
}

export type LocationStatus = 'idle' | 'granted' | 'denied' | 'unavailable';

export interface LocationResult {
  coords: Coordinates;
  status: LocationStatus;
}

export async function requestCurrentPosition(): Promise<LocationResult> {
  try {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) return { coords: HAMBURG_CENTER, status: 'denied' };

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      coords: { lat: position.coords.latitude, lng: position.coords.longitude },
      status: 'granted',
    };
  } catch {
    return { coords: HAMBURG_CENTER, status: 'unavailable' };
  }
}
