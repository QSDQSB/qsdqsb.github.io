/**
 * The sun at the moment of a photograph: how high it stood, where, and how
 * far the frame fell from sunrise, sunset and solar noon.
 *
 * Worked out once, when a photo is processed, and kept in the manifest and
 * the database; the site only puts it into words, so the wording can change
 * without reprocessing anything.
 *
 * The position comes from the low-precision solar model SunCalc uses, well
 * within a degree. It is computed at city precision (coordinates rounded to
 * 0.1°, about 10 km): the sun's height and bearing at a known instant narrow
 * down where a frame was made, so the exact GPS stays in the private manifest.
 *
 * A capture time without a UTC offset names no instant, so it gets no sun.
 */

const RAD = Math.PI / 180, J2000 = 946728000000, MINUTE = 6e4;
const HORIZON = -0.833; // the sun's upper limb on the horizon, with refraction

/** Altitude and azimuth (degrees; azimuth from north, clockwise) at `ms` for a place. */
export function sunPosition(ms, lat, lng) {
  const d = (ms - J2000) / 864e5, M = RAD * (357.5291 + 0.98560028 * d);
  const L = M + RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) + RAD * 102.9372 + Math.PI;
  const e = RAD * 23.4397, dec = Math.asin(Math.sin(e) * Math.sin(L)), ra = Math.atan2(Math.sin(L) * Math.cos(e), Math.cos(L));
  const H = RAD * (280.16 + 360.9856235 * d) + RAD * lng - ra, phi = RAD * lat;
  const alt = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
  const az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));
  return { alt: alt / RAD, az: (az / RAD + 180 + 360) % 360 };
}

/** Whole minutes from `t` to the nearest event, signed; null when there is none within 20 hours (polar day or night). */
function nearest(events, t) {
  if (!events.length) return null;
  const e = events.reduce((a, b) => (Math.abs(b - t) < Math.abs(a - t) ? b : a));
  return Math.round((e - t) / MINUTE);
}

/**
 * The sun for a capture time and a place.
 * @param {string} taken  ISO local time with its offset, e.g. 2023-06-25T21:17:04+01:00
 * @param {{lat:number,lng:number}|null} gps
 * @returns {{alt:number, az:number, rising:boolean, toSunrise:number|null, toSunset:number|null, toNoon:number|null}|null}
 */
export function sunAt(taken, gps) {
  if (!taken || !gps || !/(Z|[+-]\d{2}:\d{2})$/.test(taken)) return null;
  const t = Date.parse(taken);
  if (!Number.isFinite(t) || !Number.isFinite(gps.lat) || !Number.isFinite(gps.lng)) return null;
  const lat = Math.round(gps.lat * 10) / 10, lng = Math.round(gps.lng * 10) / 10;
  const at = (ms) => sunPosition(ms, lat, lng).alt;

  // Two-minute steps across ±20 h find the crossings and the noons; bisection pins each to the second.
  const ups = [], downs = [], noons = [];
  const refine = (a, b, f) => { for (let k = 0; k < 8; k++) { const m = (a + b) / 2; if (f(m)) b = m; else a = m; } return b; };
  let prev = at(t - 1200 * MINUTE), rising = null;
  for (let m = -1200; m < 1200; m += 2) {
    const a0 = t + m * MINUTE, a1 = a0 + 2 * MINUTE, next = at(a1);
    if (prev < HORIZON && next >= HORIZON) ups.push(refine(a0, a1, (x) => at(x) >= HORIZON));
    if (prev >= HORIZON && next < HORIZON) downs.push(refine(a0, a1, (x) => at(x) < HORIZON));
    const goingUp = next > prev;
    if (rising === true && !goingUp) noons.push(refine(a0 - 2 * MINUTE, a1, (x) => at(x + MINUTE) < at(x)));
    rising = goingUp; prev = next;
  }
  const pos = sunPosition(t, lat, lng);
  return {
    alt: Math.round(pos.alt * 10) / 10,
    az: Math.round(pos.az),
    rising: at(t + MINUTE) > at(t),
    toSunrise: nearest(ups, t),
    toSunset: nearest(downs, t),
    toNoon: nearest(noons, t),
  };
}
