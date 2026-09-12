/**
 * SafeWay geocoding proxy.
 *
 * Keeps the OpenRouteService key server-side. Supports autocomplete, full
 * search and reverse lookups, biased to Hamburg.
 */

const ORS_KEY = Deno.env.get('ORS_API_KEY') ?? '';

const HAMBURG = { lat: 53.5511, lng: 9.9937 };
const HAMBURG_RECT = { minLng: 9.6, minLat: 53.3, maxLng: 10.4, maxLat: 53.8 };

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface Body {
  mode?: 'autocomplete' | 'search' | 'reverse';
  text?: string;
  point?: { lat: number; lng: number };
  focus?: { lat: number; lng: number };
  size?: number;
}

interface Feature {
  geometry?: { coordinates?: [number, number] };
  properties?: Record<string, unknown>;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function toPlace(feature: Feature) {
  const coords = feature.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;
  const props = feature.properties ?? {};
  const name = typeof props.name === 'string' ? props.name : '';
  const label = typeof props.label === 'string' ? props.label : name;
  const locality =
    (typeof props.locality === 'string' && props.locality) ||
    (typeof props.localadmin === 'string' && props.localadmin) ||
    (typeof props.region === 'string' && props.region) ||
    '';
  const id =
    (typeof props.gid === 'string' && props.gid) ||
    (typeof props.id === 'string' && props.id) ||
    `${coords[1].toFixed(5)},${coords[0].toFixed(5)}`;

  return {
    id,
    name: name || label,
    label,
    locality,
    lat: coords[1],
    lng: coords[0],
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  if (!ORS_KEY) return json({ error: 'missing_ors_key' }, 500);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return json({ error: 'invalid_body' }, 400);
  }

  const mode = body.mode ?? 'autocomplete';
  const size = Math.min(Math.max(body.size ?? 8, 1), 15);
  const focus = body.focus ?? HAMBURG;

  const params = new URLSearchParams({ api_key: ORS_KEY, size: String(size) });
  let path = 'geocode/autocomplete';

  if (mode === 'reverse') {
    const point = body.point;
    if (!point) return json({ error: 'missing_point' }, 400);
    path = 'geocode/reverse';
    params.set('point.lon', String(point.lng));
    params.set('point.lat', String(point.lat));
    params.set('size', '1');
  } else {
    const text = (body.text ?? '').trim();
    if (text.length < 2) return json({ places: [] });
    path = mode === 'search' ? 'geocode/search' : 'geocode/autocomplete';
    params.set('text', text);
    params.set('focus.point.lon', String(focus.lng));
    params.set('focus.point.lat', String(focus.lat));
    params.set('boundary.rect.min_lon', String(HAMBURG_RECT.minLng));
    params.set('boundary.rect.min_lat', String(HAMBURG_RECT.minLat));
    params.set('boundary.rect.max_lon', String(HAMBURG_RECT.maxLng));
    params.set('boundary.rect.max_lat', String(HAMBURG_RECT.maxLat));
  }

  try {
    const response = await fetch(`https://api.openrouteservice.org/${path}?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error('ORS geocode failed', response.status, detail.slice(0, 400));
      return json({ error: 'geocode_failed', status: response.status }, 502);
    }

    const data = (await response.json()) as { features?: Feature[] };
    const places = (data.features ?? [])
      .map(toPlace)
      .filter((place): place is NonNullable<ReturnType<typeof toPlace>> => place !== null);

    return json({ places });
  } catch (error) {
    console.error('ORS geocode threw', error);
    return json({ error: 'geocode_unreachable' }, 502);
  }
});
