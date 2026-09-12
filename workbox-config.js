// Workbox config for the post-export PWA step (`npm run build:pwa`):
// precaches everything `expo export -p web` writes to dist/ so the installed
// app loads (and reloads) offline.
module.exports = {
  globDirectory: 'dist/',
  globPatterns: ['**/*.{js,css,html,json,png,jpg,jpeg,gif,svg,ico,webp,woff,woff2,ttf,otf}'],
  swDest: 'dist/sw.js',
  // Expo web JS bundles regularly exceed workbox's 2 MiB default.
  maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
  // App is exported with `output: 'single'` (SPA) — serve index.html for
  // offline navigations to client-side routes.
  navigateFallback: '/index.html',
  // Republished builds take over open clients on next load instead of waiting.
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
};
