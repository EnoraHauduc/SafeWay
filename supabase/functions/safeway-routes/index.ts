/**
 * SafeWay routing pipeline. Exported from the deployed Bilt Cloud function.
 */

const ORS_KEY = Deno.env.get('ORS_API_KEY') ?? '';
const BILT_URL = Deno.env.get('EXPO_PUBLIC_BILT_URL') ?? '';
const SERVICE_KEY = Deno.env.get('BILT_SERVICE_KEY') ?? '';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const TILE = 0.02;
const MAX_TILES = 12;
const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const SAMPLE_SPACING_M = 25;
const MATCH_RADIUS_M = 45;
const MAX_AVOID_CELLS = 18;
const MAX_GEOMETRY_POINTS = 280;
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

type Mode = 'walking' | 'cycling' | 'driving';
type Lighting = 'prefer_lit' | 'avoid_unlit' | 'none';
type StreetType = 'residential' | 'main' | 'avoid_isolated' | 'none';
type Activity = 'quiet' | 'moderate' | 'busy';
type RouteKind = 'recommended' | 'quieter' | 'fastest';
interface LatLng {
  lat: number;
  lng: number;
}
interface Prefs {
  lighting: Lighting;
  streetType: StreetType;
  activity: Activity;
  isNight: boolean;
  extraTimeMinutes: number;
}
interface RequestBody {
  origin: LatLng;
  destination?: LatLng;
  destinationQuery?: string;
  mode?: Mode;
  prefs?: Partial<Prefs>;
  language?: string;
}
type Sample = [number, number, number, number];
interface TilePayload {
  v: number;
  s: Sample[];
}
const PROFILES: Record<Mode, string> = {
  walking: 'foot-walking',
  cycling: 'cycling-regular',
  driving: 'driving-car',
};
const EXTRA_INFO: Record<Mode, string[]> = {
  walking: ['waytype', 'green', 'noise'],
  cycling: ['waytype', 'surface'],
  driving: ['waytype', 'surface'],
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}
function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
function toRad(value: number) {
  return (value * Math.PI) / 180;
}
function distanceMeters(a: LatLng, b: LatLng) {
  const meanLat = toRad((a.lat + b.lat) / 2);
  const dx = toRad(b.lng - a.lng) * Math.cos(meanLat) * 6371000;
  const dy = toRad(b.lat - a.lat) * 6371000;
  return Math.hypot(dx, dy);
}
function distanceToSegment(point: LatLng, a: LatLng, b: LatLng) {
  const meanLat = toRad((a.lat + b.lat) / 2);
  const scaleX = Math.cos(meanLat) * 111320;
  const scaleY = 110540;
  const px = point.lng * scaleX,
    py = point.lat * scaleY;
  const ax = a.lng * scaleX,
    ay = a.lat * scaleY;
  const bx = b.lng * scaleX,
    by = b.lat * scaleY;
  const dx = bx - ax,
    dy = by - ay,
    lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(px - ax, py - ay);
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / lengthSquared, 0, 1);
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function classCode(highway: string | undefined) {
  if (!highway) return 0;
  if (highway === 'residential' || highway === 'living_street') return 1;
  if (
    [
      'primary',
      'secondary',
      'tertiary',
      'trunk',
      'primary_link',
      'secondary_link',
      'tertiary_link',
    ].includes(highway)
  )
    return 2;
  if (['footway', 'path', 'steps', 'track', 'pedestrian', 'cycleway'].includes(highway)) return 3;
  return 0;
}
interface OverpassWay {
  type: string;
  tags?: Record<string, string>;
  geometry?: { lat: number; lon: number }[];
}
function buildTilePayload(elements: OverpassWay[]): TilePayload {
  const samples: Sample[] = [];
  for (const element of elements) {
    if (element.type !== 'way' || !element.geometry || element.geometry.length < 2) continue;
    const lit = element.tags?.lit;
    if (lit !== 'yes' && lit !== 'no' && lit !== '24/7' && lit !== 'automatic') continue;
    const flag = lit === 'no' ? 0 : 1,
      cls = classCode(element.tags?.highway);
    let carried = SAMPLE_SPACING_M;
    let previous = { lat: element.geometry[0].lat, lng: element.geometry[0].lon };
    for (let index = 1; index < element.geometry.length; index += 1) {
      const current = { lat: element.geometry[index].lat, lng: element.geometry[index].lon };
      carried += distanceMeters(previous, current);
      if (carried >= SAMPLE_SPACING_M) {
        carried = 0;
        samples.push([
          Number(((previous.lat + current.lat) / 2).toFixed(5)),
          Number(((previous.lng + current.lng) / 2).toFixed(5)),
          flag,
          cls,
        ]);
      }
      previous = current;
    }
  }
  return {
    v: 1,
    s: samples.length > 14000 ? samples.filter((_, index) => index % 2 === 0) : samples,
  };
}
async function fetchTileFromOverpass(
  south: number,
  west: number,
  north: number,
  east: number,
): Promise<TilePayload> {
  const query = `[out:json][timeout:50];way["highway"]["lit"](${south},${west},${north},${east});out tags geom;`;
  let lastError = 'unknown';
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ data: query }),
      });
      if (!response.ok) {
        lastError = `status_${response.status}`;
        continue;
      }
      const data = (await response.json()) as { elements?: OverpassWay[] };
      return buildTilePayload(data.elements ?? []);
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'fetch_failed';
    }
  }
  throw new Error(`overpass_failed:${lastError}`);
}
function dbHeaders() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  };
}
async function readCachedTile(key: string): Promise<TilePayload | null> {
  if (!BILT_URL || !SERVICE_KEY) return null;
  try {
    const response = await fetch(
      `${BILT_URL}/rest/v1/osm_cache?cache_key=eq.${encodeURIComponent(key)}&select=payload,fetched_at`,
      { headers: dbHeaders() },
    );
    if (!response.ok) return null;
    const rows = (await response.json()) as { payload: TilePayload; fetched_at: string }[];
    const row = rows[0];
    if (
      !row ||
      Date.now() - new Date(row.fetched_at).getTime() > CACHE_TTL_MS ||
      !row.payload ||
      !Array.isArray(row.payload.s)
    )
      return null;
    return row.payload;
  } catch (error) {
    console.error('cache read failed', error);
    return null;
  }
}
async function writeCachedTile(key: string, payload: TilePayload) {
  if (!BILT_URL || !SERVICE_KEY) return;
  try {
    await fetch(`${BILT_URL}/rest/v1/osm_cache`, {
      method: 'POST',
      headers: { ...dbHeaders(), Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ cache_key: key, payload, fetched_at: new Date().toISOString() }),
    });
  } catch (error) {
    console.error('cache write failed', error);
  }
}
interface LightingLayer {
  samples: Sample[];
  index: Map<string, Sample[]>;
  cached: number;
  fetched: number;
}
const CELL_LAT = 0.0009,
  CELL_LNG = 0.0014;
function cellKey(lat: number, lng: number) {
  return `${Math.floor(lat / CELL_LAT)}:${Math.floor(lng / CELL_LNG)}`;
}
function buildIndex(samples: Sample[]) {
  const index = new Map<string, Sample[]>();
  for (const sample of samples) {
    const key = cellKey(sample[0], sample[1]);
    const bucket = index.get(key);
    if (bucket) bucket.push(sample);
    else index.set(key, [sample]);
  }
  return index;
}
function nearestSample(index: Map<string, Sample[]>, point: LatLng): Sample | null {
  let best: Sample | null = null,
    bestDistance = MATCH_RADIUS_M;
  const baseLat = Math.floor(point.lat / CELL_LAT),
    baseLng = Math.floor(point.lng / CELL_LNG);
  for (let dLat = -1; dLat <= 1; dLat += 1)
    for (let dLng = -1; dLng <= 1; dLng += 1) {
      const bucket = index.get(`${baseLat + dLat}:${baseLng + dLng}`);
      if (!bucket) continue;
      for (const sample of bucket) {
        const distance = distanceMeters(point, { lat: sample[0], lng: sample[1] });
        if (distance < bestDistance) {
          bestDistance = distance;
          best = sample;
        }
      }
    }
  return best;
}
async function loadLightingLayer(
  bbox: { minLat: number; minLng: number; maxLat: number; maxLng: number },
  notes: string[],
): Promise<LightingLayer | null> {
  const minTileLat = Math.floor(bbox.minLat / TILE),
    maxTileLat = Math.floor(bbox.maxLat / TILE);
  const minTileLng = Math.floor(bbox.minLng / TILE),
    maxTileLng = Math.floor(bbox.maxLng / TILE);
  const tiles: { lat: number; lng: number }[] = [];
  for (let lat = minTileLat; lat <= maxTileLat; lat += 1)
    for (let lng = minTileLng; lng <= maxTileLng; lng += 1) tiles.push({ lat, lng });
  if (tiles.length > MAX_TILES) {
    notes.push('osm_area_too_large');
    return null;
  }
  const samples: Sample[] = [];
  let cached = 0,
    fetched = 0;
  const results = await Promise.allSettled(
    tiles.map(async (tile) => {
      const key = `lit:v1:${tile.lat}:${tile.lng}`;
      const cachedPayload = await readCachedTile(key);
      if (cachedPayload) {
        cached += 1;
        return cachedPayload;
      }
      const payload = await fetchTileFromOverpass(
        tile.lat * TILE,
        tile.lng * TILE,
        (tile.lat + 1) * TILE,
        (tile.lng + 1) * TILE,
      );
      fetched += 1;
      await writeCachedTile(key, payload);
      return payload;
    }),
  );
  let failures = 0;
  for (const result of results)
    if (result.status === 'fulfilled') samples.push(...result.value.s);
    else {
      failures += 1;
      console.error('tile failed', result.reason);
    }
  if (failures > 0) notes.push('osm_partial');
  if (samples.length === 0) {
    if (failures > 0) notes.push('osm_unavailable');
    return null;
  }
  return { samples, index: buildIndex(samples), cached, fetched };
}
function buildAvoidPolygons(layer: LightingLayer, origin: LatLng, destination: LatLng) {
  const cells = new Map<string, { lat: number; lng: number; distance: number }>();
  for (const sample of layer.samples) {
    if (sample[2] !== 0) continue;
    const point = { lat: sample[0], lng: sample[1] },
      distance = distanceToSegment(point, origin, destination);
    if (distance > 900) continue;
    const key = cellKey(point.lat, point.lng),
      existing = cells.get(key);
    if (!existing || distance < existing.distance) cells.set(key, { ...point, distance });
  }
  const chosen = [...cells.values()]
    .sort((a, b) => a.distance - b.distance)
    .slice(0, MAX_AVOID_CELLS);
  if (chosen.length === 0) return null;
  const coordinates = chosen.map((cell) => {
    const minLat = Math.floor(cell.lat / CELL_LAT) * CELL_LAT,
      minLng = Math.floor(cell.lng / CELL_LNG) * CELL_LNG,
      maxLat = minLat + CELL_LAT,
      maxLng = minLng + CELL_LNG;
    return [
      [
        [minLng, minLat],
        [maxLng, minLat],
        [maxLng, maxLat],
        [minLng, maxLat],
        [minLng, minLat],
      ],
    ];
  });
  return { polygons: { type: 'MultiPolygon', coordinates }, count: chosen.length };
}
interface OrsSummary {
  distance: number;
  duration: number;
}
interface OrsStep {
  distance: number;
  duration: number;
  instruction: string;
  name?: string;
  type?: number;
  way_points: [number, number];
}
interface OrsExtraSummary {
  value: number;
  distance: number;
  amount: number;
}
interface OrsFeature {
  geometry: { coordinates: [number, number][] };
  properties: {
    summary?: OrsSummary;
    segments?: { steps?: OrsStep[] }[];
    extras?: Record<string, { summary?: OrsExtraSummary[] }>;
  };
}
async function orsDirections(profile: string, body: unknown): Promise<OrsFeature[]> {
  const response = await fetch(
    `https://api.openrouteservice.org/v2/directions/${profile}/geojson`,
    {
      method: 'POST',
      headers: {
        Authorization: ORS_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/geo+json',
      },
      body: JSON.stringify(body),
    },
  );
  if (!response.ok)
    throw new Error(`ors_${response.status}:${(await response.text()).slice(0, 300)}`);
  return ((await response.json()) as { features?: OrsFeature[] }).features ?? [];
}
interface Metrics {
  distanceMeters: number;
  durationSeconds: number;
  litShare: number | null;
  knownShare: number;
  mainRoadShare: number;
  streetShare: number;
  pathShare: number;
  greenMean: number | null;
  noiseMean: number | null;
  activityIndex: number;
}
function extraMean(summary: OrsExtraSummary[] | undefined) {
  if (!summary?.length) return null;
  let weighted = 0,
    total = 0;
  for (const entry of summary) {
    weighted += entry.value * entry.amount;
    total += entry.amount;
  }
  return total === 0 ? null : clamp(weighted / total / 10, 0, 1);
}
function waytypeShares(summary: OrsExtraSummary[] | undefined) {
  const shares = { mainRoad: 0, street: 0, path: 0 };
  for (const entry of summary ?? []) {
    const amount = entry.amount / 100;
    if (entry.value === 1 || entry.value === 2) shares.mainRoad += amount;
    else if (entry.value === 3 || entry.value === 6) shares.street += amount;
    else if ([4, 5, 7, 8].includes(entry.value)) shares.path += amount;
  }
  return shares;
}
function computeMetrics(feature: OrsFeature, layer: LightingLayer | null): Metrics {
  const coordinates = feature.geometry.coordinates,
    summary = feature.properties.summary ?? { distance: 0, duration: 0 };
  let litLength = 0,
    unlitLength = 0,
    totalLength = 0;
  for (let index = 1; index < coordinates.length; index += 1) {
    const previous = { lat: coordinates[index - 1][1], lng: coordinates[index - 1][0] },
      current = { lat: coordinates[index][1], lng: coordinates[index][0] };
    const length = distanceMeters(previous, current);
    totalLength += length;
    if (!layer) continue;
    const sample = nearestSample(layer.index, {
      lat: (previous.lat + current.lat) / 2,
      lng: (previous.lng + current.lng) / 2,
    });
    if (sample?.[2] === 1) litLength += length;
    else if (sample) unlitLength += length;
  }
  const knownLength = litLength + unlitLength,
    knownShare = totalLength > 0 ? knownLength / totalLength : 0,
    litShare = knownShare >= 0.2 ? litLength / knownLength : null;
  const extras = feature.properties.extras ?? {},
    shares = waytypeShares(extras.waytype?.summary),
    greenMean = extraMean(extras.green?.summary),
    noiseMean = extraMean(extras.noise?.summary);
  let activityIndex = clamp(shares.mainRoad * 0.9 + shares.street * 0.5 + shares.path * 0.12, 0, 1);
  if (noiseMean !== null) activityIndex = clamp(activityIndex * 0.6 + noiseMean * 0.4, 0, 1);
  if (greenMean !== null) activityIndex = clamp(activityIndex - greenMean * 0.15, 0, 1);
  return {
    distanceMeters: Math.round(summary.distance),
    durationSeconds: Math.round(summary.duration),
    litShare,
    knownShare,
    mainRoadShare: shares.mainRoad,
    streetShare: shares.street,
    pathShare: shares.path,
    greenMean,
    noiseMean,
    activityIndex,
  };
}
function streetScore(metrics: Metrics, prefs: Prefs) {
  if (prefs.streetType === 'residential')
    return clamp(
      metrics.streetShare + metrics.pathShare * 0.35 + metrics.mainRoadShare * 0.1,
      0,
      1,
    );
  if (prefs.streetType === 'main')
    return clamp(metrics.mainRoadShare + metrics.streetShare * 0.6 + metrics.pathShare * 0.1, 0, 1);
  if (prefs.streetType === 'avoid_isolated')
    return clamp(1 - metrics.pathShare * 0.85 - (metrics.greenMean ?? 0) * 0.25, 0, 1);
  return 0.5;
}
function scoreCandidate(metrics: Metrics, prefs: Prefs, fastestDuration: number) {
  const target = prefs.activity === 'quiet' ? 0.18 : prefs.activity === 'busy' ? 0.82 : 0.5;
  const activityScore = 1 - Math.abs(metrics.activityIndex - target),
    lightScore = metrics.litShare ?? 0.5,
    street = streetScore(metrics, prefs);
  const lightWeight =
    prefs.lighting === 'none'
      ? 0
      : prefs.isNight
        ? 0.46
        : prefs.lighting === 'avoid_unlit'
          ? 0.36
          : 0.3;
  const activityWeight = 0.28,
    streetWeight = prefs.streetType === 'none' ? 0.1 : 0.22;
  const tolerated = Math.max(
    0,
    Math.max(0, (metrics.durationSeconds - fastestDuration) / 60) - prefs.extraTimeMinutes,
  );
  return clamp(
    (lightWeight * lightScore + activityWeight * activityScore + streetWeight * street) /
      (lightWeight + activityWeight + streetWeight) -
      clamp(tolerated * 0.05, 0, 0.5),
    0,
    1,
  );
}
function downsample(coordinates: [number, number][]) {
  const points = coordinates.map((c) => ({ latitude: c[1], longitude: c[0] }));
  if (points.length <= MAX_GEOMETRY_POINTS) return points;
  const stride = Math.ceil(points.length / MAX_GEOMETRY_POINTS),
    reduced = points.filter((_, index) => index % stride === 0),
    last = points[points.length - 1],
    tail = reduced[reduced.length - 1];
  if (tail.latitude !== last.latitude || tail.longitude !== last.longitude) reduced.push(last);
  return reduced;
}
function buildTags(metrics: Metrics, kind: RouteKind, prefs: Prefs) {
  const tags: string[] = [];
  if (metrics.litShare !== null && metrics.litShare >= 0.7) tags.push('well_lit');
  else if (metrics.litShare !== null && metrics.litShare <= 0.35) tags.push('some_dark_stretches');
  if (metrics.activityIndex <= 0.3) tags.push('quiet_streets');
  else if (metrics.activityIndex >= 0.65) tags.push('busy_streets');
  else tags.push('moderate_activity');
  if (metrics.mainRoadShare >= 0.4) tags.push('main_roads');
  else if (metrics.pathShare >= 0.4) tags.push('paths_and_parks');
  if (kind === 'fastest') tags.push('shortest_time');
  if (kind === 'quieter' && prefs.activity !== 'quiet') tags.push('calmer_than_usual');
  return tags.slice(0, 3);
}
function stepLocation(coordinates: [number, number][], index: number) {
  const coordinate = coordinates[Math.min(index, coordinates.length - 1)];
  return { latitude: coordinate[1], longitude: coordinate[0] };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (!ORS_KEY) return json({ error: 'missing_ors_key' }, 500);
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return json({ error: 'invalid_body' }, 400);
  }
  const origin = body.origin;
  if (!origin || typeof origin.lat !== 'number' || typeof origin.lng !== 'number')
    return json({ error: 'missing_origin' }, 400);
  const notes: string[] = [];
  let destination = body.destination ?? null,
    destinationLabel: string | null = null;
  if (!destination && body.destinationQuery) {
    const params = new URLSearchParams({
      api_key: ORS_KEY,
      text: body.destinationQuery,
      size: '1',
      'focus.point.lon': String(origin.lng),
      'focus.point.lat': String(origin.lat),
      'boundary.country': 'DE',
    });
    const geocode = await fetch(
      `https://api.openrouteservice.org/geocode/search?${params.toString()}`,
    );
    if (geocode.ok) {
      const data = (await geocode.json()) as {
        features?: {
          geometry?: { coordinates?: [number, number] };
          properties?: { label?: string };
        }[];
      };
      const feature = data.features?.[0],
        coordinates = feature?.geometry?.coordinates;
      if (coordinates) {
        destination = { lat: coordinates[1], lng: coordinates[0] };
        destinationLabel = feature?.properties?.label ?? null;
      }
    }
  }
  if (!destination) return json({ error: 'destination_not_found' }, 400);
  const mode: Mode = body.mode ?? 'walking',
    profile = PROFILES[mode] ?? PROFILES.walking;
  const prefs: Prefs = {
    lighting: body.prefs?.lighting ?? 'prefer_lit',
    streetType: body.prefs?.streetType ?? 'none',
    activity: body.prefs?.activity ?? 'moderate',
    isNight: body.prefs?.isNight ?? false,
    extraTimeMinutes: body.prefs?.extraTimeMinutes ?? 5,
  };
  const language = body.language === 'de' ? 'de' : 'en',
    pad = 0.008;
  const bbox = {
    minLat: Math.min(origin.lat, destination.lat) - pad,
    maxLat: Math.max(origin.lat, destination.lat) + pad,
    minLng: Math.min(origin.lng, destination.lng) - pad,
    maxLng: Math.max(origin.lng, destination.lng) + pad,
  };
  const layer = await loadLightingLayer(bbox, notes),
    avoid =
      layer && prefs.lighting !== 'none' ? buildAvoidPolygons(layer, origin, destination) : null;
  const base = {
    coordinates: [
      [origin.lng, origin.lat],
      [destination.lng, destination.lat],
    ],
    instructions: true,
    language,
    units: 'm',
    extra_info: EXTRA_INFO[mode],
    radiuses: [400, 400],
  };
  const requests: { tag: string; body: Record<string, unknown> }[] = [
    {
      tag: 'plain',
      body: {
        ...base,
        preference: 'fastest',
        alternative_routes: { target_count: 3, share_factor: 0.6, weight_factor: 1.5 },
      },
    },
  ];
  const tunedOptions: Record<string, unknown> = {};
  if (avoid) tunedOptions.avoid_polygons = avoid.polygons;
  if (profile === 'foot-walking') {
    const weightings: Record<string, unknown> = {};
    if (prefs.activity === 'quiet') weightings.quiet = { factor: 0.9 };
    else if (prefs.activity === 'moderate') weightings.quiet = { factor: 0.4 };
    if (prefs.streetType === 'residential') weightings.quiet = { factor: 0.7 };
    if (Object.keys(weightings).length) tunedOptions.profile_params = { weightings };
  }
  requests.push({
    tag: 'tuned',
    body: { ...base, preference: 'recommended', options: tunedOptions },
  });
  requests.push(
    profile === 'foot-walking'
      ? {
          tag: 'calm',
          body: {
            ...base,
            preference: 'recommended',
            options: {
              profile_params: { weightings: { quiet: { factor: 1 }, green: { factor: 0.8 } } },
            },
          },
        }
      : { tag: 'short', body: { ...base, preference: 'shortest' } },
  );
  const settled = await Promise.allSettled(
    requests.map(async (request) => ({
      tag: request.tag,
      features: await orsDirections(profile, request.body),
    })),
  );
  const candidates: { tag: string; feature: OrsFeature }[] = [];
  let firstError: string | null = null;
  for (const [index, result] of settled.entries())
    if (result.status === 'fulfilled')
      for (const feature of result.value.features)
        candidates.push({ tag: result.value.tag, feature });
    else {
      const message =
        result.reason instanceof Error ? result.reason.message : String(result.reason);
      console.error('ORS request failed', requests[index].tag, message);
      if (!firstError) firstError = message;
      if (requests[index].tag === 'tuned' && avoid) notes.push('avoid_rejected');
    }
  if (!candidates.length)
    try {
      const features = await orsDirections(profile, {
        coordinates: base.coordinates,
        instructions: true,
        language,
        units: 'm',
        radiuses: [400, 400],
      });
      for (const feature of features) candidates.push({ tag: 'fallback', feature });
      if (features.length) notes.push('reduced_detail');
    } catch (error) {
      console.error('ORS fallback failed', error);
    }
  if (!candidates.length)
    return json(
      {
        error:
          firstError?.includes('2010') || firstError?.includes('Could not find')
            ? 'no_route_near_points'
            : 'routing_failed',
      },
      502,
    );
  const unique: { tag: string; feature: OrsFeature; metrics: Metrics }[] = [];
  for (const candidate of candidates) {
    const metrics = computeMetrics(candidate.feature, layer);
    if (
      !unique.some(
        (entry) =>
          Math.abs(entry.metrics.durationSeconds - metrics.durationSeconds) < 8 &&
          Math.abs(entry.metrics.distanceMeters - metrics.distanceMeters) < 30,
      )
    )
      unique.push({ ...candidate, metrics });
  }
  const fastestDuration = Math.min(...unique.map((entry) => entry.metrics.durationSeconds));
  const scored = unique.map((entry) => ({
    ...entry,
    score: scoreCandidate(entry.metrics, prefs, fastestDuration),
  }));
  const assigned = new Map<RouteKind, (typeof scored)[number]>(),
    taken = new Set<(typeof scored)[number]>();
  const pick = (
    kind: RouteKind,
    sorter: (a: (typeof scored)[number], b: (typeof scored)[number]) => number,
  ) => {
    const choice = [...scored].sort(sorter).find((entry) => !taken.has(entry));
    if (choice) {
      assigned.set(kind, choice);
      taken.add(choice);
    }
  };
  pick('recommended', (a, b) => b.score - a.score);
  pick('fastest', (a, b) => a.metrics.durationSeconds - b.metrics.durationSeconds);
  pick('quieter', (a, b) => a.metrics.activityIndex - b.metrics.activityIndex);
  const options = (['recommended', 'quieter', 'fastest'] as RouteKind[])
    .filter((kind) => assigned.has(kind))
    .map((kind) => {
      const entry = assigned.get(kind)!,
        coordinates = entry.feature.geometry.coordinates;
      const steps = (entry.feature.properties.segments ?? [])
        .flatMap((segment) => segment.steps ?? [])
        .slice(0, 80)
        .map((step) => ({
          instruction: step.instruction,
          name: step.name && step.name !== '-' ? step.name : null,
          distanceMeters: Math.round(step.distance),
          durationSeconds: Math.round(step.duration),
          location: stepLocation(coordinates, step.way_points?.[0] ?? 0),
        }));
      return {
        id: `${kind}-${entry.metrics.durationSeconds}-${entry.metrics.distanceMeters}`,
        kind,
        durationSeconds: entry.metrics.durationSeconds,
        distanceMeters: entry.metrics.distanceMeters,
        deltaSecondsVsFastest: entry.metrics.durationSeconds - fastestDuration,
        score: Number(entry.score.toFixed(3)),
        litShare:
          entry.metrics.litShare === null ? null : Number(entry.metrics.litShare.toFixed(3)),
        lightingCoverage: Number(entry.metrics.knownShare.toFixed(3)),
        activityIndex: Number(entry.metrics.activityIndex.toFixed(3)),
        activityLevel:
          entry.metrics.activityIndex <= 0.3
            ? 'low'
            : entry.metrics.activityIndex >= 0.65
              ? 'high'
              : 'moderate',
        mainRoadShare: Number(entry.metrics.mainRoadShare.toFixed(3)),
        streetShare: Number(entry.metrics.streetShare.toFixed(3)),
        pathShare: Number(entry.metrics.pathShare.toFixed(3)),
        greenIndex:
          entry.metrics.greenMean === null ? null : Number(entry.metrics.greenMean.toFixed(3)),
        noiseIndex:
          entry.metrics.noiseMean === null ? null : Number(entry.metrics.noiseMean.toFixed(3)),
        avoidedUnlitAreas: entry.tag === 'tuned' && avoid ? avoid.count : 0,
        tags: buildTags(entry.metrics, kind, prefs),
        geometry: downsample(coordinates),
        steps,
      };
    });
  return json({
    options,
    origin,
    destination: { ...destination, label: destinationLabel },
    mode,
    prefs,
    meta: {
      notes,
      lightingSamples: layer?.samples.length ?? 0,
      tilesFromCache: layer?.cached ?? 0,
      tilesFetched: layer?.fetched ?? 0,
      avoidCells: avoid?.count ?? 0,
      candidateCount: unique.length,
    },
  });
});
