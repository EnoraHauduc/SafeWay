/**
 * Sunrise / sunset from the NOAA solar position approximation, so night mode
 * can switch over without a network call.
 */

interface SunTimes {
  sunrise: Date;
  sunset: Date;
}

function dayOfYear(date: Date) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const current = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((current - start) / 86400000) + 1;
}

export function getSunTimes(date: Date, lat: number, lng: number): SunTimes | null {
  const gamma = ((2 * Math.PI) / 365) * (dayOfYear(date) - 1);

  const eqTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  const latRad = (lat * Math.PI) / 180;
  const zenith = (90.833 * Math.PI) / 180;

  const cosHourAngle =
    Math.cos(zenith) / (Math.cos(latRad) * Math.cos(decl)) - Math.tan(latRad) * Math.tan(decl);

  if (cosHourAngle > 1 || cosHourAngle < -1) return null;

  const hourAngle = (Math.acos(cosHourAngle) * 180) / Math.PI;
  const midnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

  const sunriseMinutes = 720 - 4 * (lng + hourAngle) - eqTime;
  const sunsetMinutes = 720 - 4 * (lng - hourAngle) - eqTime;

  return {
    sunrise: new Date(midnight + sunriseMinutes * 60000),
    sunset: new Date(midnight + sunsetMinutes * 60000),
  };
}

export function isNightAt(date: Date, lat: number, lng: number) {
  const times = getSunTimes(date, lat, lng);
  if (!times) return date.getUTCHours() < 6 || date.getUTCHours() >= 20;
  return date.getTime() < times.sunrise.getTime() || date.getTime() >= times.sunset.getTime();
}
