SafeWay
choose your safeway.

SafeWay is a mobile app that finds walking and cycling routes for Hamburg, Germany based on how safe and comfortable a street feels — not just how fast it is. Instead of a single "best" route, SafeWay returns a few options ranked against the traveler's own preferences (lighting, street type, foot traffic), each with a plain-language explanation of the trade-offs.

Built for AI.Women Hamburg by Enora Hauduc, Hannah Kalker, Janne Achenbach, Megha Darda, Dominika Oliinyk

## Try it now

SafeWay is live and ready to use — no install required:

🔗 **[Launch SafeWay](your-bilt-url-here)**

Just open the link on your phone or laptop browser to try the full flow: set your preferences, search a route, and compare the Recommended / Quieter / Fastest options.

> Built and hosted via [Bilt](https://bilt.me) for the hackathon — the link above runs the live app directly in your browser. 

## Screenshots



Why
Standard navigation apps optimize for time or distance. But the route someone actually wants to take at 11pm is often not the fastest one — it's the one with streetlights, other people around, and no shortcuts through a dark park. SafeWay lets people encode that preference once and get routes that respect it every time, with an automatic "night mode" that tightens preferences after sunset.

How it works
SafeWay doesn't invent its own safety data — it derives a safety/comfort score from open data and layers it on top of a real routing engine:

Geocode the origin and destination (OpenRouteService Geocode API).
Fetch street data for the surrounding area from OpenStreetMap via the Overpass API — pulling lit, highway, and related tags for every way in the bounding box.
Classify each street segment as lit/unlit and by type (residential, main road, footpath/isolated) based on those OSM tags.
Build routing constraints from that classification — an avoid layer for unlit/isolated segments that the user wants to steer around.
Call OpenRouteService Directions (foot-walking / cycling-regular profiles) with those constraints via avoid_polygons to generate 2–3 route alternatives: Recommended, Quieter, and Fastest.
Score and compare the alternatives (time delta vs. fastest, % of route lit, street-type mix) to power the "Why this route?" explanation panel.
All of the OSM/Overpass fetching, classification, and ORS calls happen server-side in Supabase Edge Functions, so the ORS API key never ships to the client and the app only ever receives finished route + score data (see Architecture notes below for why).

Core flow
Home/map — current location, a Night mode toggle, destination search, Home/Work shortcuts, and a transport mode selector (Walking / Bicycle / Transit / Car).
Destination search — From/To fields (From defaults to current location) plus recent destinations.
Preferences — toggles for lighting (prefer lit / avoid unlit / no preference), street type (residential / main roads / avoid isolated paths), activity level (foot traffic), and auto night-mode detection after sunset.
Route comparison — three ranked options, each with duration, distance, and tags like "Well-lit · Moderate activity," plus an expandable "Why this route?" panel explaining the trade-off (e.g. "+3 min vs. fastest, but more well-lit streets").
Route detail — a full breakdown by Lighting / Activity / Time, a disclaimer that this is a personalized suggestion and conditions can change, and a "Use this route" CTA that starts turn-by-turn navigation.
Tech stack
App: React Native + Expo (Expo Router), TypeScript, Zustand, TanStack Query
Maps: react-native-maps / pigeon-maps
Backend: Supabase Edge Functions (Deno) — supabase/functions/safeway-routes, supabase/functions/safeway-geocode
Routing: OpenRouteService (Directions + Geocode APIs)
Street/lighting data: OpenStreetMap via the Overpass API
Architecture notes
Raw OSM/Overpass GeoJSON for a city-sized bounding box is large and awkward to hand to a mobile client, and avoid_polygons payloads for ORS need to be built from that data before every routing call. To keep the app fast and the ORS key private, all of that lives server-side:

safeway-routes tiles the route corridor, fetches/caches Overpass data per tile (with a TTL cache to avoid re-querying Overpass on every request), classifies ways, builds the avoid layer, calls ORS, and returns just the finished routes + comparison stats.
safeway-geocode proxies ORS geocoding/autocomplete so the client never holds the ORS key.
The client only ever deals with small, finished JSON — no raw GeoJSON parsing on-device.

## Local development

For anyone who wants to run or extend the codebase directly:

npm install
npx expo start

Scan the QR code with Expo Go, or run npm run ios / npm run android.

Environment
The Supabase Edge Functions require:

ORS_API_KEY — your OpenRouteService API key
Set it as a secret on your Supabase project (supabase secrets set ORS_API_KEY=...) before deploying the functions in supabase/functions/.

Disclaimer
Route suggestions are based on publicly available OpenStreetMap data and are personalized guidance, not a safety guarantee — actual lighting, foot traffic, and conditions can change and may not always be reflected in the underlying map data.
