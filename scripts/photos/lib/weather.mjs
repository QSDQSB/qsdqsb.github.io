/**
 * The weather at the moment of a photograph: the air temperature and the WMO weather code for
 * the hour nearest the frame, from Open-Meteo's historical archive (ERA5 reanalysis, corrected
 * to the ground's own elevation, so a frame on a mountain is not given the valley's warmth).
 *
 * Asked once, when a photo is processed, and kept in the manifest beside the sun. The position is
 * rounded to 0.01° (about a kilometre) before it leaves: enough for the elevation to be right, and
 * the exact GPS stays private. Answers are cached per place and day, so a gallery costs a handful
 * of requests. Open-Meteo is free for non-commercial use and asks for attribution.
 *
 * A capture time without a UTC offset takes the instant the sun was worked out for (instantOf).
 */

import { instantOf } from './sun.mjs';

const API = 'https://archive-api.open-meteo.com/v1/archive';
const OFFSET = /(Z|[+-]\d{2}:\d{2})$/;
const days = new Map();

async function day(lat, lng, date, fetchImpl) {
  const key = `${lat},${lng},${date}`;
  if (!days.has(key)) {
    const u = new URL(API);
    for (const [k, v] of Object.entries({ latitude: lat, longitude: lng, start_date: date, end_date: date, hourly: 'temperature_2m,weather_code', timezone: 'GMT' })) u.searchParams.set(k, v);
    days.set(key, fetchImpl(u, { signal: AbortSignal.timeout(20000) })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null));
  }
  return days.get(key);
}

/**
 * @param {string} taken  ISO local time with its offset
 * @param {{lat:number,lng:number}|null} gps
 * @returns {Promise<{t:number, code:number}|null>}  °C to the degree, and the WMO code
 */
export async function weatherAt(taken, gps, fetchImpl = fetch) {
  if (!taken || !OFFSET.test(taken) || !gps || !Number.isFinite(gps.lat) || !Number.isFinite(gps.lng)) return null;
  const t = Date.parse(taken);
  if (!Number.isFinite(t)) return null;
  const hour = new Date(Math.round(t / 3600e3) * 3600e3);
  const date = hour.toISOString().slice(0, 10);
  const lat = Math.round(gps.lat * 100) / 100, lng = Math.round(gps.lng * 100) / 100;
  const j = await day(lat, lng, date, fetchImpl);
  const h = j?.hourly;
  if (!h?.time) return null;
  const i = h.time.indexOf(hour.toISOString().slice(0, 13) + ':00');
  const temp = h.temperature_2m?.[i], code = h.weather_code?.[i];
  if (i < 0 || !Number.isFinite(temp) || !Number.isFinite(code)) return null;
  return { t: Math.round(temp), code };
}

/**
 * Give every photo of a gallery that has no weather yet its weather, once; like the sun, a photo
 * keeps what it is given, and only one still missing a time or a place is asked again.
 * @returns {Promise<number>} how many photos were given their weather
 */
export async function weatherGallery(photos, gpsOf, place, fetchImpl = fetch) {
  const times = photos.map((p) => p.taken).filter(Boolean);
  let n = 0;
  for (const p of photos) {
    if (p.weather) continue;
    const where = gpsOf(p.slug) || place;
    const w = await weatherAt(instantOf(p.taken, times, where?.lng), where, fetchImpl);
    if (w) { p.weather = w; n++; } else if (!('weather' in p)) p.weather = null;
  }
  return n;
}
