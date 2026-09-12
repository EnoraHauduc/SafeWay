/**
 * SafeWay brand colors as React Native parseable values.
 *
 * Use these only where a raw color prop is required (SVG paint, map polylines,
 * icon color props, status bar). Everywhere else use Uniwind classes such as
 * `bg-lime`, `text-ink`, `bg-lilac-tint`, defined in global.css.
 */
export const BRAND = {
  ink: '#1C1630',
  inkSoft: '#4A4266',
  lilac: '#B8A4F7',
  lilacSoft: '#DDD4FC',
  lilacTint: '#F1EDFE',
  lime: '#C9E265',
  limeDeep: '#AFCB49',
  amethyst: '#6244D4',
  mist: '#F6F4FB',
  white: '#FFFFFF',
  muted: '#6B6486',
} as const;

export const ROUTE_COLORS = {
  recommended: BRAND.amethyst,
  quieter: '#7C5BE0',
  fastest: BRAND.inkSoft,
  inactive: '#B9B2CE',
} as const;
