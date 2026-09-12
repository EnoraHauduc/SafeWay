import type { TFunction } from 'i18next';

import type { TransitImportance } from '@/lib/stores/preferences';
import type {
  ActivityPreference,
  LightingPreference,
  StreetPreference,
  TravelMode,
} from '@/lib/routing';

export function lightingLabel(t: TFunction, lighting: LightingPreference) {
  if (lighting === 'prefer_lit') return t('prefs.lightingPreferLit');
  if (lighting === 'avoid_unlit') return t('prefs.lightingAvoidUnlit');
  return t('prefs.lightingNone');
}

export function activityLabel(t: TFunction, activity: ActivityPreference) {
  if (activity === 'quiet') return t('prefs.activityQuiet');
  if (activity === 'busy') return t('prefs.activityBusy');
  return t('prefs.activityModerate');
}

export function streetLabel(t: TFunction, streetType: StreetPreference) {
  if (streetType === 'residential') return t('prefs.streetResidential');
  if (streetType === 'main') return t('prefs.streetMain');
  if (streetType === 'avoid_isolated') return t('prefs.streetAvoidIsolated');
  return t('prefs.streetNone');
}

export function extraTimeLabel(t: TFunction, minutes: number) {
  if (minutes <= 0) return t('extras.timeNone');
  if (minutes >= 10) return t('extras.timeTen');
  return t('extras.timeFive');
}

export function transitLabel(t: TFunction, importance: TransitImportance) {
  if (importance === 'not') return t('extras.transitNot');
  if (importance === 'very') return t('extras.transitVery');
  return t('extras.transitSomewhat');
}

export function modeLabel(t: TFunction, mode: TravelMode) {
  if (mode === 'cycling') return t('map.modeCycling');
  if (mode === 'driving') return t('map.modeDriving');
  return t('map.modeWalking');
}

export function routeKindLabel(t: TFunction, kind: 'recommended' | 'quieter' | 'fastest') {
  if (kind === 'quieter') return t('routes.kindQuieter');
  if (kind === 'fastest') return t('routes.kindFastest');
  return t('routes.kindRecommended');
}
