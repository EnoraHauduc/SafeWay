import type { StyleProp, ViewStyle } from 'react-native';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface MapRegion extends LatLng {
  latitudeDelta: number;
  longitudeDelta: number;
}

export type MapType = 'standard' | 'satellite' | 'hybrid' | 'terrain';

export type MarkerColor = 'red' | 'blue' | 'green' | 'orange' | 'yellow' | 'purple' | 'cyan';
export type CustomMarkerColor = string & { readonly __customMarkerColor?: never };
export type MarkerColorValue = MarkerColor | CustomMarkerColor;

export interface MapPointEvent {
  coordinate: LatLng;
}

export type MapPressEvent = MapPointEvent;

export interface MapPoiClickEvent extends MapPointEvent {
  name: string;
  placeId?: string;
}

export interface MapUserLocationEvent {
  coordinate?: LatLng & {
    accuracy?: number;
    altitude?: number;
    heading?: number;
    speed?: number;
    timestamp?: number;
  };
  error?: { message: string };
}

export interface MapMarker {
  id?: string;
  coordinate: LatLng;
  title?: string;
  description?: string;
  color?: MarkerColorValue;
  draggable?: boolean;
  opacity?: number;
  onPress?: (marker: MapMarker) => void;
  onCalloutPress?: (marker: MapMarker) => void;
  onDragStart?: (coordinate: LatLng) => void;
  onDrag?: (coordinate: LatLng) => void;
  onDragEnd?: (coordinate: LatLng) => void;
}

export interface MapPolyline {
  id?: string;
  coordinates: LatLng[];
  strokeColor?: string;
  strokeWidth?: number;
  lineDashPattern?: number[];
}

export interface MapPolygon {
  id?: string;
  coordinates: LatLng[];
  strokeColor?: string;
  strokeWidth?: number;
  fillColor?: string;
}

export interface MapCircle {
  id?: string;
  center: LatLng;
  radius: number;
  strokeColor?: string;
  strokeWidth?: number;
  fillColor?: string;
}

export interface MapEdgePadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface MapCamera {
  center: LatLng;
  heading?: number;
  pitch?: number;
  zoom?: number;
  altitude?: number;
}

export interface MapSnapshotOptions {
  width?: number;
  height?: number;
  format?: 'png' | 'jpg';
  quality?: number;
  result?: 'file' | 'base64';
}

export interface MapFitOptions {
  animated?: boolean;
  edgePadding?: MapEdgePadding;
}

export interface MapViewHandle {
  animateToRegion: (region: MapRegion, duration?: number) => void;
  animateCamera: (camera: Partial<MapCamera>, options?: { duration?: number }) => void;
  fitToCoordinates: (coordinates: LatLng[], options?: MapFitOptions) => void;
  takeSnapshot: (options?: MapSnapshotOptions) => Promise<string | undefined>;
}

export interface MapViewSharedProps {
  initialRegion?: MapRegion;
  region?: MapRegion;
  onRegionChange?: (region: MapRegion) => void;
  onRegionChangeComplete?: (region: MapRegion) => void;

  mapType?: MapType;
  showsUserLocation?: boolean;

  scrollEnabled?: boolean;
  zoomEnabled?: boolean;

  markers?: MapMarker[];
  polylines?: MapPolyline[];
  polygons?: MapPolygon[];
  circles?: MapCircle[];

  onMapReady?: () => void;
  onMapLoaded?: () => void;
  onPress?: (event: MapPressEvent) => void;
  onMarkerPress?: (marker: MapMarker) => void;

  minZoomLevel?: number;
  maxZoomLevel?: number;

  style?: StyleProp<ViewStyle>;
  className?: string;
}

export interface MapViewNativeProps {
  showsTraffic?: boolean;
  showsBuildings?: boolean;
  showsCompass?: boolean;
  showsIndoors?: boolean;
  showsMyLocationButton?: boolean;
  showsPointsOfInterest?: boolean;
  showsScale?: boolean;
  loadingEnabled?: boolean;
  loadingBackgroundColor?: string;
  loadingIndicatorColor?: string;
  mapPadding?: MapEdgePadding;
  moveOnMarkerPress?: boolean;
  toolbarEnabled?: boolean;
  zoomControlEnabled?: boolean;

  followsUserLocation?: boolean;

  rotateEnabled?: boolean;
  pitchEnabled?: boolean;

  onLongPress?: (event: MapPressEvent) => void;
  onPoiClick?: (event: MapPoiClickEvent) => void;
  onUserLocationChange?: (event: MapUserLocationEvent) => void;
}

export interface MapViewWebProps {
  zoomLevel?: number;
}

export interface MapViewProps extends MapViewSharedProps, MapViewNativeProps, MapViewWebProps {}

export const DEFAULT_REGION: MapRegion = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export const DEFAULT_ZOOM = 12;

export const MARKER_COLOR_HEX: Record<MarkerColor, string> = {
  red: '#ef4444',
  blue: '#2563eb',
  green: '#16a34a',
  orange: '#f97316',
  yellow: '#eab308',
  purple: '#a855f7',
  cyan: '#06b6d4',
};

export const MAP_OVERLAY_DEFAULTS = {
  circle: {
    fillColor: 'rgba(220, 38, 38, 0.12)',
    strokeColor: '#dc2626',
    strokeWidth: 2,
  },
  polygon: {
    fillColor: 'rgba(34, 197, 94, 0.18)',
    strokeColor: '#16a34a',
    strokeWidth: 2,
  },
  polyline: {
    strokeColor: '#2563eb',
    strokeWidth: 3,
  },
} as const;

function isMarkerColor(color: string): color is MarkerColor {
  return color in MARKER_COLOR_HEX;
}

export function getMarkerColor(color: MarkerColorValue | undefined) {
  if (!color) return MARKER_COLOR_HEX.red;
  return isMarkerColor(color) ? MARKER_COLOR_HEX[color] : color;
}

export function markerKey(marker: MapMarker, index: number) {
  return marker.id ?? `${marker.coordinate.latitude}:${marker.coordinate.longitude}:${index}`;
}

export function regionToCenter(coordinate: LatLng): [latitude: number, longitude: number] {
  return [coordinate.latitude, coordinate.longitude];
}

export function pointToLatLng(point: [latitude: number, longitude: number]): LatLng {
  return { latitude: point[0], longitude: point[1] };
}

export function latLngToGeoJsonPoint(coordinate: LatLng): [longitude: number, latitude: number] {
  return [coordinate.longitude, coordinate.latitude];
}

export function regionToZoom(region: MapRegion) {
  const zoom = Math.round(Math.log2(360 / region.latitudeDelta));
  return Math.max(1, Math.min(20, Number.isFinite(zoom) ? zoom : DEFAULT_ZOOM));
}

export function zoomToRegion(center: LatLng, zoom: number): MapRegion {
  const delta = 360 / Math.pow(2, zoom);
  return {
    ...center,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}

export function createCircleCoordinates(center: LatLng, radiusMeters: number, segments = 64) {
  const earthRadiusMeters = 6378137;
  const latitude = (center.latitude * Math.PI) / 180;
  const longitude = (center.longitude * Math.PI) / 180;
  const angularDistance = radiusMeters / earthRadiusMeters;

  return Array.from({ length: segments + 1 }, (_, index) => {
    const bearing = (2 * Math.PI * index) / segments;
    const pointLatitude = Math.asin(
      Math.sin(latitude) * Math.cos(angularDistance) +
        Math.cos(latitude) * Math.sin(angularDistance) * Math.cos(bearing),
    );
    const pointLongitude =
      longitude +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latitude),
        Math.cos(angularDistance) - Math.sin(latitude) * Math.sin(pointLatitude),
      );

    return {
      latitude: (pointLatitude * 180) / Math.PI,
      longitude: (pointLongitude * 180) / Math.PI,
    };
  });
}
