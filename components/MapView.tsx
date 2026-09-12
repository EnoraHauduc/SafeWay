import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Platform, Text, UIManager, View } from 'react-native';
import RNMapView, {
  Circle,
  Marker,
  Polygon,
  Polyline,
  type Camera,
  type LongPressEvent,
  type MapPressEvent as NativeMapPressEvent,
  type MapType as NativeMapType,
  type MarkerDragStartEndEvent,
  type PoiClickEvent,
  type UserLocationChangeEvent,
} from 'react-native-maps';

import {
  DEFAULT_REGION,
  MAP_OVERLAY_DEFAULTS,
  getMarkerColor,
  markerKey,
  type MapCamera,
  type MapCircle,
  type MapMarker,
  type MapPolygon,
  type MapPolyline,
  type MapPressEvent,
  type MapSnapshotOptions,
  type MapType,
  type MapViewHandle,
  type MapViewProps,
} from './MapView.types';

const noop = () => {};

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
  MapViewNativeProps,
  MapType,
  MapUserLocationEvent,
  MapViewHandle,
  MapViewProps,
  MapViewSharedProps,
  MapViewWebProps,
  MarkerColor,
} from './MapView.types';

const toNativeMapType = (mapType: MapType): NativeMapType => mapType;

const toNativeCamera = (camera: Partial<MapCamera>): Partial<Camera> => ({
  ...camera,
  heading: camera.heading ?? 0,
  pitch: camera.pitch ?? 0,
});

const toPressEvent = (event: NativeMapPressEvent | LongPressEvent): MapPressEvent => ({
  coordinate: event.nativeEvent.coordinate,
});

function hasNativeMapView() {
  if (Platform.OS === 'web') return false;

  const getViewManagerConfig = UIManager.getViewManagerConfig?.bind(UIManager);
  if (!getViewManagerConfig) return true;

  return Boolean(getViewManagerConfig('AIRMap') ?? getViewManagerConfig('AIRGoogleMap'));
}

function renderMarker(
  marker: MapMarker,
  index: number,
  onMarkerPress: MapViewProps['onMarkerPress'],
) {
  const handleDragStart = marker.onDragStart
    ? (event: MarkerDragStartEndEvent) => marker.onDragStart?.(event.nativeEvent.coordinate)
    : undefined;
  const handleDrag = marker.onDrag
    ? (event: { nativeEvent: { coordinate: MapMarker['coordinate'] } }) =>
        marker.onDrag?.(event.nativeEvent.coordinate)
    : undefined;
  const handleDragEnd = marker.onDragEnd
    ? (event: MarkerDragStartEndEvent) => marker.onDragEnd?.(event.nativeEvent.coordinate)
    : undefined;

  return (
    <Marker
      key={markerKey(marker, index)}
      coordinate={marker.coordinate}
      title={marker.title}
      description={marker.description}
      pinColor={getMarkerColor(marker.color)}
      draggable={marker.draggable}
      opacity={marker.opacity}
      onCalloutPress={marker.onCalloutPress ? () => marker.onCalloutPress?.(marker) : undefined}
      onDrag={handleDrag}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onPress={() => {
        marker.onPress?.(marker);
        onMarkerPress?.(marker);
      }}
    />
  );
}

function renderPolyline(polyline: MapPolyline, index: number) {
  return (
    <Polyline
      key={polyline.id ?? `polyline-${index}`}
      coordinates={polyline.coordinates}
      strokeColor={polyline.strokeColor ?? MAP_OVERLAY_DEFAULTS.polyline.strokeColor}
      strokeWidth={polyline.strokeWidth ?? MAP_OVERLAY_DEFAULTS.polyline.strokeWidth}
      lineDashPattern={polyline.lineDashPattern}
    />
  );
}

function renderPolygon(polygon: MapPolygon, index: number) {
  return (
    <Polygon
      key={polygon.id ?? `polygon-${index}`}
      coordinates={polygon.coordinates}
      strokeColor={polygon.strokeColor ?? MAP_OVERLAY_DEFAULTS.polygon.strokeColor}
      strokeWidth={polygon.strokeWidth ?? MAP_OVERLAY_DEFAULTS.polygon.strokeWidth}
      fillColor={polygon.fillColor ?? MAP_OVERLAY_DEFAULTS.polygon.fillColor}
    />
  );
}

function renderCircle(circle: MapCircle, index: number) {
  return (
    <Circle
      key={circle.id ?? `circle-${index}`}
      center={circle.center}
      radius={circle.radius}
      strokeColor={circle.strokeColor ?? MAP_OVERLAY_DEFAULTS.circle.strokeColor}
      strokeWidth={circle.strokeWidth ?? MAP_OVERLAY_DEFAULTS.circle.strokeWidth}
      fillColor={circle.fillColor ?? MAP_OVERLAY_DEFAULTS.circle.fillColor}
    />
  );
}

const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  {
    initialRegion = DEFAULT_REGION,
    region,
    onRegionChange,
    onRegionChangeComplete,
    mapType = 'standard',
    showsTraffic = false,
    showsBuildings = true,
    showsCompass = true,
    showsIndoors = true,
    showsMyLocationButton = true,
    showsPointsOfInterest = true,
    showsScale = true,
    loadingEnabled = false,
    loadingBackgroundColor,
    loadingIndicatorColor,
    mapPadding,
    moveOnMarkerPress,
    toolbarEnabled,
    zoomControlEnabled,
    showsUserLocation = false,
    followsUserLocation = false,
    scrollEnabled = true,
    zoomEnabled = true,
    rotateEnabled = true,
    pitchEnabled = true,
    markers = [],
    polylines = [],
    polygons = [],
    circles = [],
    onMapReady,
    onMapLoaded,
    onPress,
    onLongPress,
    onMarkerPress,
    onPoiClick,
    onUserLocationChange,
    minZoomLevel,
    maxZoomLevel,
    style,
    className,
  },
  ref,
) {
  const nativeMapRef = useRef<RNMapView>(null);

  useImperativeHandle(
    ref,
    () => ({
      animateToRegion: (nextRegion, duration = 700) => {
        nativeMapRef.current?.animateToRegion(nextRegion, duration);
      },
      animateCamera: (camera, options) => {
        nativeMapRef.current?.animateCamera(toNativeCamera(camera), options);
      },
      fitToCoordinates: (coordinates, options) => {
        nativeMapRef.current?.fitToCoordinates(coordinates, options);
      },
      takeSnapshot: (options?: MapSnapshotOptions) =>
        nativeMapRef.current?.takeSnapshot(options ?? {}) ?? Promise.resolve(undefined),
    }),
    [],
  );

  if (!hasNativeMapView()) {
    return (
      <View
        style={[
          {
            alignItems: 'center',
            backgroundColor: '#f8fafc',
            justifyContent: 'center',
            padding: 24,
          },
          style,
        ]}
        className={className}
      >
        <Text
          style={{
            color: '#0f172a',
            fontSize: 16,
            fontWeight: '700',
            marginBottom: 8,
            textAlign: 'center',
          }}
        >
          Map unavailable in this runtime
        </Text>
        <Text style={{ color: '#64748b', fontSize: 13, lineHeight: 18, textAlign: 'center' }}>
          This screen needs the native react-native-maps view. Use a development build or a runtime
          that includes it.
        </Text>
      </View>
    );
  }

  return (
    <View style={style} className={className}>
      <RNMapView
        ref={nativeMapRef}
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        region={region}
        mapType={toNativeMapType(mapType)}
        loadingEnabled={loadingEnabled}
        loadingBackgroundColor={loadingBackgroundColor}
        loadingIndicatorColor={loadingIndicatorColor}
        mapPadding={mapPadding}
        moveOnMarkerPress={moveOnMarkerPress}
        showsTraffic={showsTraffic}
        showsBuildings={showsBuildings}
        showsCompass={showsCompass}
        showsIndoors={showsIndoors}
        showsMyLocationButton={showsMyLocationButton}
        showsPointsOfInterests={showsPointsOfInterest}
        showsScale={showsScale}
        showsUserLocation={showsUserLocation}
        followsUserLocation={followsUserLocation}
        scrollEnabled={scrollEnabled}
        zoomEnabled={zoomEnabled}
        rotateEnabled={rotateEnabled}
        pitchEnabled={pitchEnabled}
        toolbarEnabled={toolbarEnabled}
        zoomControlEnabled={zoomControlEnabled}
        minZoomLevel={minZoomLevel}
        maxZoomLevel={maxZoomLevel}
        onMapReady={onMapReady ?? noop}
        onMapLoaded={onMapLoaded}
        onRegionChange={onRegionChange}
        onRegionChangeComplete={onRegionChangeComplete}
        onPress={onPress ? (event) => onPress(toPressEvent(event)) : undefined}
        onLongPress={onLongPress ? (event) => onLongPress(toPressEvent(event)) : undefined}
        onPoiClick={
          onPoiClick
            ? (event: PoiClickEvent) =>
                onPoiClick({
                  coordinate: event.nativeEvent.coordinate,
                  name: event.nativeEvent.name,
                  placeId: event.nativeEvent.placeId,
                })
            : undefined
        }
        onUserLocationChange={
          onUserLocationChange
            ? (event: UserLocationChangeEvent) =>
                onUserLocationChange({
                  coordinate: event.nativeEvent.coordinate,
                  error: event.nativeEvent.error,
                })
            : undefined
        }
      >
        {markers.map((marker, index) => renderMarker(marker, index, onMarkerPress))}
        {polylines.map(renderPolyline)}
        {polygons.map(renderPolygon)}
        {circles.map(renderCircle)}
      </RNMapView>
    </View>
  );
});

export default MapView;
