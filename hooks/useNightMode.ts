import { useEffect, useState } from 'react';

import { isNightAt } from '@/lib/night';
import { usePreferences } from '@/lib/stores/preferences';
import { useSession } from '@/lib/stores/session';

const REFRESH_MS = 5 * 60 * 1000;

export interface NightState {
  /** Night preferences currently applied to routing. */
  isNight: boolean;
  /** Whether the sun is actually down where the user is. */
  afterSunset: boolean;
  /** False when the user has flipped the map toggle by hand. */
  automatic: boolean;
}

export function useNightMode(): NightState {
  const autoNightMode = usePreferences((state) => state.autoNightMode);
  const nightOverride = usePreferences((state) => state.nightOverride);
  const location = useSession((state) => state.location);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  const afterSunset = isNightAt(new Date(now), location.lat, location.lng);

  if (nightOverride !== null) {
    return { isNight: nightOverride, afterSunset, automatic: false };
  }

  return { isNight: autoNightMode && afterSunset, afterSunset, automatic: true };
}
