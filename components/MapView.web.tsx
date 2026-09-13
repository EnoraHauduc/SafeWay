import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { GeoJson, Map, Marker, Overlay, type Point } from 'pigeon-maps';
import { StyleSheet, Text, View } from 'react-native';

import {
  DEFAULT_REGION,
  MAP_OVERLAY_DEFAULTS,
  createCircleCoordinates,
  getMarkerColor,
  latLngToGeoJsonPoint,
  markerKey,
  pointToLatLng,
  regionToCenter,
  regionToZoom,
  zoomToRegion,
  type LatLng,
  type MapCircle,
  type MapPolygon,
  type MapPolyline,
  type MapRegion,
  type MapType,
  type MapViewHandle,
  type MapViewProps,
} from './MapView.types';

export type {
  LatLng,
  MapCamera,
  MapCircle,
  MapFitOptions,
  MapMarker,
  MapPoiClickEvent,
  MapPointEvent,
  MapPolygon,
  MapPolyline,
  MapPressEvent,
  MapRegion,
  MapSnapshotOptions,
  MapType,
  MapUserLocationEvent,
  MapViewHandle,
  MapViewNativeProps,
  MapViewProps,
  MapViewSharedProps,
  MapViewWebProps,
  MarkerColor,
} from './MapView.types';

interface GeoJsonFeature {
  type: 'Feature';
  geometry: {
    type: 'LineString' | 'Polygon';
    coordinates: [number, number][] | [number, number][][];
  };
  properties: {
    svgAttributes: Record<string, string | number | undefined>;
  };
}

const REGION_EPSILON = 0.000001;

function getNumericStyleHeight(style: MapViewProps['style'], fallback = 400) {
  const flattenedStyle = StyleSheet.flatten(style);
  return typeof flattenedStyle?.height === 'number' ? flattenedStyle.height : fallback;
}

function regionsAreClose(left: MapRegion, right: MapRegion) {
  return (
    Math.abs(left.latitude - right.latitude) < REGION_EPSILON &&
    Math.abs(left.longitude - right.longitude) < REGION_EPSILON &&
    Math.abs(left.latitudeDelta - right.latitudeDelta) < REGION_EPSILON &&
    Math.abs(left.longitudeDelta - right.longitudeDelta) < REGION_EPSILON
  );
}

function tileProvider(mapType?: MapType) {
  if (mapType === 'satellite' || mapType === 'hybrid') {
    return (x: number, y: number, z: number) =>
      `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
  }

  if (mapType === 'terrain') {
    return (x: number, y: number, z: number) => `https://a.tile.opentopomap.org/${z}/${x}/${y}.png`;
  }

  return undefined;
}

function closeRing(coordinates: LatLng[]) {
  if (coordinates.length === 0) return coordinates;

  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  if (first.latitude === last.latitude && first.longitude === last.longitude) {
    return coordinates;
  }

  return [...coordinates, first];
}

function polylineFeature(polyline: MapPolyline): GeoJsonFeature {
  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: polyline.coordinates.map(latLngToGeoJsonPoint),
    },
    properties: {
      svgAttributes: {
        fill: 'none',
        stroke: polyline.strokeColor ?? MAP_OVERLAY_DEFAULTS.polyline.strokeColor,
        strokeWidth: polyline.strokeWidth ?? MAP_OVERLAY_DEFAULTS.polyline.strokeWidth,
        strokeDasharray: polyline.lineDashPattern?.join(' '),
      },
    },
  };
}

function polygonFeature(polygon: MapPolygon): GeoJsonFeature {
  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [closeRing(polygon.coordinates).map(latLngToGeoJsonPoint)],
    },
    properties: {
      svgAttributes: {
        fill: polygon.fillColor ?? MAP_OVERLAY_DEFAULTS.polygon.fillColor,
        stroke: polygon.strokeColor ?? MAP_OVERLAY_DEFAULTS.polygon.strokeColor,
        strokeWidth: polygon.strokeWidth ?? MAP_OVERLAY_DEFAULTS.polygon.strokeWidth,
      },
    },
  };
}

function circleFeature(circle: MapCircle): GeoJsonFeature {
  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [
        createCircleCoordinates(circle.center, circle.radius).map(latLngToGeoJsonPoint),
      ],
    },
    properties: {
      svgAttributes: {
        fill: circle.fillColor ?? MAP_OVERLAY_DEFAULTS.circle.fillColor,
        stroke: circle.strokeColor ?? MAP_OVERLAY_DEFAULTS.circle.strokeColor,
        strokeWidth: circle.strokeWidth ?? MAP_OVERLAY_DEFAULTS.circle.strokeWidth,
      },
    },
  };
}

function regionForCoordinates(coordinates: LatLng[]): MapRegion | undefined {
  if (coordinates.length === 0) return undefined;

  let minLatitude = coordinates[0].latitude;
  let maxLatitude = coordinates[0].latitude;
  let minLongitude = coordinates[0].longitude;
  let maxLongitude = coordinates[0].longitude;

  for (let index = 1; index < coordinates.length; index += 1) {
    const { latitude, longitude } = coordinates[index];
    minLatitude = Math.min(minLatitude, latitude);
    maxLatitude = Math.max(maxLatitude, latitude);
    minLongitude = Math.min(minLongitude, longitude);
    maxLongitude = Math.max(maxLongitude, longitude);
  }

  return {
    latitude: (minLatitude + maxLatitude) / 2,
    longitude: (minLongitude + maxLongitude) / 2,
    latitudeDelta: Math.max((maxLatitude - minLatitude) * 1.35, 0.01),
    longitudeDelta: Math.max((maxLongitude - minLongitude) * 1.35, 0.01),
  };
}

const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  {
    initialRegion = DEFAULT_REGION,
    region,
    onRegionChange,
    onRegionChangeComplete,
    mapType = 'standard',
    markers = [],
    polylines = [],
    polygons = [],
    circles = [],
    onMapReady,
    onMapLoaded,
    onPress,
    onMarkerPress,
    scrollEnabled = true,
    zoomEnabled = true,
    zoomLevel,
    minZoomLevel,
    maxZoomLevel,
    style,
    className,
  },
  ref,
) {
  const [internalRegion, setInternalRegion] = useState(initialRegion);
  const activeRegion = region ?? internalRegion;
  const activeZoom = zoomLevel ?? regionToZoom(activeRegion);
  const mapHeight = getNumericStyleHeight(style);
  const lastRegionRef = useRef(activeRegion);
  const lifecycleCallbacksRef = useRef({ onMapLoaded, onMapReady });

  const overlayData = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: [
        ...polylines.map(polylineFeature),
        ...polygons.map(polygonFeature),
        ...circles.map(circleFeature),
      ],
    }),
    [circles, polygons, polylines],
  );

  const setMapRegion = useCallback(
    (nextRegion: MapRegion) => {
      if (regionsAreClose(lastRegionRef.current, nextRegion)) return;

      lastRegionRef.current = nextRegion;

      if (!region) {
        setInternalRegion(nextRegion);
      }
      onRegionChange?.(nextRegion);
      onRegionChangeComplete?.(nextRegion);
    },
    [onRegionChange, onRegionChangeComplete, region],
  );

  useEffect(() => {
    lastRegionRef.current = activeRegion;
  }, [activeRegion]);

  useEffect(() => {
    lifecycleCallbacksRef.current = { onMapLoaded, onMapReady };
  }, [onMapLoaded, onMapReady]);

  useImperativeHandle(
    ref,
    () => ({
      animateToRegion: (nextRegion) => {
        setMapRegion(nextRegion);
      },
      animateCamera: (camera) => {
        if (!camera.center) return;
        setMapRegion(zoomToRegion(camera.center, camera.zoom ?? activeZoom));
      },
      fitToCoordinates: (coordinates) => {
        const nextRegion = regionForCoordinates(coordinates);
        if (nextRegion) setMapRegion(nextRegion);
      },
      takeSnapshot: () => Promise.resolve(undefined),
    }),
    [activeZoom, setMapRegion],
  );

  useEffect(() => {
    lifecycleCallbacksRef.current.onMapReady?.();
    lifecycleCallbacksRef.current.onMapLoaded?.();
  }, []);

  const handleBoundsChanged = useCallback(
    ({ center, zoom }: { center: Point; zoom: number }) => {
      setMapRegion(zoomToRegion(pointToLatLng(center), zoom));
    },
    [setMapRegion],
  );

  const handleClick = useCallback(
    ({ latLng }: { latLng: Point }) => {
      onPress?.({ coordinate: pointToLatLng(latLng) });
    },
    [onPress],
  );

  return (
    <View style={style} className={className}>
      <Map
        center={regionToCenter(activeRegion)}
        zoom={activeZoom}
        provider={tileProvider(mapType)}
        height={mapHeight}
        animate
        attribution={false}
        attributionPrefix={false}
        mouseEvents={scrollEnabled}
        touchEvents={scrollEnabled}
        minZoom={zoomEnabled ? minZoomLevel : activeZoom}
        maxZoom={zoomEnabled ? maxZoomLevel : activeZoom}
        zoomSnap={zoomEnabled}
        onBoundsChanged={handleBoundsChanged}
        onClick={onPress ? handleClick : undefined}
      >
        <GeoJson
          data={overlayData}
          styleCallback={(feature: GeoJsonFeature) => feature.properties.svgAttributes}
        />

        {markers.map((marker, index) => (
          <Marker
            key={markerKey(marker, index)}
            anchor={regionToCenter(marker.coordinate)}
            color={getMarkerColor(marker.color)}
            onClick={() => {
              marker.onPress?.(marker);
              onMarkerPress?.(marker);
            }}
          />
        ))}

        {markers
          .filter((marker) => marker.title || marker.description)
          .map((marker, index) => (
            <Overlay
              key={`label-${markerKey(marker, index)}`}
              anchor={regionToCenter(marker.coordinate)}
              offset={[12, -56]}
            >
              <View
                style={{
                  backgroundColor: '#ffffff',
                  borderColor: 'rgba(15, 23, 42, 0.12)',
                  borderRadius: 8,
                  borderWidth: 1,
                  maxWidth: 180,
                  paddingHorizontal: 8,
                  paddingVertical: 6,
                  boxShadow: '0 10px 20px rgba(15, 23, 42, 0.14)',
                }}
              >
                {marker.title ? (
                  <Text style={{ color: '#0f172a', fontSize: 12, fontWeight: '700' }}>
                    {marker.title}
                  </Text>
                ) : null}
                {marker.description ? (
                  <Text style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>
                    {marker.description}
                  </Text>
                ) : null}
              </View>
            </Overlay>
          ))}
      </Map>
    </View>
  );
});

export default MapView;
