/**
 * The photo database's Worker.
 *
 * queue(): R2 events for <gallery>/manifest.json and <gallery>/.private.json
 *   (both in the originals bucket; nothing public is read). For each gallery touched in
 *   a batch, read both files once and bring D1 in step, writing only what
 *   changed. Each manifest entry resolves to a permanent photo id:
 *
 *     1. by source key    london/DSCF1797.jpg seen before: same photo, even
 *                         when its file is replaced by a new edit
 *     2. by camera key    camera model + shutter count: the same exposure,
 *                         moved to another voyage or renamed (no serial is kept)
 *     3. by content hash  the same bytes already known under another key
 *     4. a new id         'p_' + ULID
 *
 *   A source gone from the manifest is marked removed, its membership too,
 *   and the photo once no source is left; nothing is ever deleted. Authored
 *   and place columns are never written here.
 *
 * fetch(): read-only, public columns only (photo_private is never read):
 *   GET /v1/galleries                  every gallery with its count
 *   GET /v1/photos?gallery=london      a gallery's photos, in order (pinned, then taken)
 *   GET /v1/photos?since=<iso>         photos changed since then, removed ones included
 *   GET /v1/photos/<id>                one photo, with its galleries
 */

const MACHINE = {
  frame: p => p.frame || (p.file ? p.file.replace(/\.[^.]+$/, '').toUpperCase() : null), hash: p => p.hash, version: p => p.version,
  w: p => p.w, h: p => p.h, ratio: p => p.ratio, thumbhash: p => p.thumbhash, tint: p => p.tint,
  sizes: p => p.sizes ? JSON.stringify(p.sizes) : null, formats: p => p.formats ? JSON.stringify(p.formats) : null,
  processed_at: p => p.processed,
  taken: p => p.taken, camera: p => p.camera, lens: p => p.lens,
  focal: p => p.focal, focal35: p => p.focal35, aperture: p => p.aperture, shutter: p => p.shutter, iso: p => p.iso,
  exposure_bias: p => p.exposureBias,
  exposure_program: p => p.exposureProgram, metering_mode: p => p.meteringMode, white_balance: p => p.whiteBalance, flash: p => p.flash,
  film_simulation: p => p.settings?.filmSimulation, dynamic_range: p => p.settings?.dynamicRange,
  dynamic_range_setting: p => p.settings?.dynamicRangeSetting,
  grain_roughness: p => p.settings?.grainRoughness, grain_size: p => p.settings?.grainSize,
  color_chrome: p => p.settings?.colorChrome, color_chrome_blue: p => p.settings?.colorChromeBlue,
  highlight_tone: p => p.settings?.highlightTone, shadow_tone: p => p.settings?.shadowTone,
  color: p => p.settings?.color, sharpness: p => p.settings?.sharpness, noise_reduction: p => p.settings?.noiseReduction,
  clarity: p => p.settings?.clarity, white_balance_fine_tune: p => p.settings?.whiteBalanceFineTune,
  focus_mode: p => p.settings?.focusMode, af_mode: p => p.settings?.afMode, shutter_type: p => p.settings?.shutterType,
  drive_mode: p => p.settings?.driveMode, stabilization: p => p.settings?.stabilization,
  shutter_count: p => p.shutterCount,
  sun_alt: p => p.sun?.alt, sun_az: p => p.sun?.az, sun_rising: p => (p.sun ? (p.sun.rising ? 1 : 0) : null),
  to_sunrise: p => p.sun?.toSunrise, to_sunset: p => p.sun?.toSunset, to_noon: p => p.sun?.toNoon,
  temp_c: p => p.weather?.t, weather_code: p => p.weather?.code,
};
const COLS = Object.keys(MACHINE);
/**
 * A short digest of everything the machine derives for a photo. A source whose
 * version and hash are unchanged is still rewritten when this moves, so a fact
 * added later (the sun, say) reaches rows the originals never touched again.
 */
export function factsDigest(p) {
  let h = 0x811c9dc5;
  for (const ch of JSON.stringify(COLS.map(c => MACHINE[c](p) ?? null))) { h ^= ch.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36);
}
const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";
const PUBLIC = ['id', ...COLS, 'place', 'place_source', 'place_landmark', 'place_street', 'place_city', 'place_country',
  'caption', 'caption_zh', 'alt', 'story', 'story_zh', 'featured', 'hidden', 'created_at', 'updated_at', 'removed_at'];
const val = (v) => (v === undefined ? null : v);

// ULID: 48 bits of milliseconds + 80 random bits, Crockford base32. Sortable by creation.
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export function ulid(now = Date.now(), rand = crypto.getRandomValues(new Uint8Array(10))) {
  let t = '', n = now;
  for (let i = 0; i < 10; i++) { t = B32[n % 32] + t; n = Math.floor(n / 32); }
  let r = '', bits = 0, acc = 0;
  for (const b of rand) { acc = (acc << 8) | b; bits += 8; while (bits >= 5) { r += B32[(acc >> (bits - 5)) & 31]; bits -= 5; } }
  return t + r.slice(0, 16);
}
export const newId = () => `p_${ulid()}`;

const chunks = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
async function inList(db, sql, values) {
  const out = [];
  for (const c of chunks(values, 90)) out.push(...(await db.prepare(sql.replace('(?)', `(${c.map(() => '?').join(',')})`)).bind(...c).all()).results);
  return out;
}

/**
 * Pure: decide each manifest entry's photo id and what to write.
 * @param {object[]} entries   manifest photos
 * @param {object} priv        .private.json photos, by slug
 * @param {{sources:Map, byCamera:Map, byHash:Map}} known   from D1
 */
export function resolve(entries, priv, known, mint = newId) {
  const out = [];
  for (const p of entries) {
    const pr = priv?.[p.slug] || {};
    const count = p.shutterCount ?? pr.shutterCount;
    const cameraKey = p.camera && count != null ? `${p.camera}#${count}` : null;
    const src = known.sources.get(p.key);
    let id = src?.photo_id, how = 'source';
    if (!id && cameraKey && known.byCamera.has(cameraKey)) { id = known.byCamera.get(cameraKey); how = 'camera'; }
    if (!id && p.hash && known.byHash.has(p.hash)) { id = known.byHash.get(p.hash); how = 'hash'; }
    if (!id) { id = mint(); how = 'new'; }
    const facts = factsDigest(p);
    const unchanged = !!(src && !src.removed_at && (src.version ?? null) === (p.version ?? null) && (src.hash ?? null) === (p.hash ?? null) && (src.facts ?? null) === facts);
    out.push({ p, pr, id, how, cameraKey, unchanged, facts });
  }
  return out;
}

export async function syncGallery(db, gallery, manifest, privDoc) {
  // Manifests written before sources were recorded carry no key: it is the gallery plus the file name.
  const entries = (manifest?.photos || []).map(p => (p.key ? p : { ...p, key: p.file ? `${gallery}/${p.file}` : null })).filter(p => p.key);
  const priv = privDoc?.photos || {};
  const sources = new Map((await db.prepare('SELECT key, photo_id, version, hash, facts, removed_at FROM sources WHERE gallery = ?').bind(gallery).all()).results.map(r => [r.key, r]));
  const keys = entries.map(p => p.key).filter(k => !sources.has(k));
  for (const r of await inList(db, 'SELECT key, photo_id, version, hash, facts, removed_at FROM sources WHERE key IN (?)', keys)) sources.set(r.key, r);
  const counts0 = [...new Set(entries.map(p => p.shutterCount).filter(c => c != null))];
  const byCamera = new Map((await inList(db, 'SELECT id, camera, shutter_count FROM photos WHERE camera IS NOT NULL AND shutter_count IN (?)', counts0))
    .map(r => [`${r.camera}#${r.shutter_count}`, r.id]));
  const hashes = [...new Set(entries.map(p => p.hash).filter(Boolean))];
  const byHash = new Map((await inList(db, 'SELECT id, hash FROM photos WHERE hash IN (?)', hashes)).map(r => [r.hash, r.id]));

  const plan = resolve(entries, priv, { sources, byCamera, byHash });
  const stmts = [];
  const counts = { new: 0, changed: 0, unchanged: 0, removed: 0, via: {} };
  for (const r of plan) {
    counts.via[r.how] = (counts.via[r.how] || 0) + 1;
    // Rows that reference a photo come after the photo's own row: D1 enforces the foreign keys.
    const membership = db.prepare(`INSERT INTO memberships (gallery, photo_id) VALUES (?, ?) ON CONFLICT (gallery, photo_id) DO UPDATE SET removed_at = NULL WHERE removed_at IS NOT NULL`).bind(gallery, r.id);
    if (r.unchanged) { counts.unchanged++; stmts.push(membership); continue; }
    counts[r.how === 'new' ? 'new' : 'changed']++;
    stmts.push(db.prepare(
      `INSERT INTO photos (id, ${COLS.join(', ')}) VALUES (?, ${COLS.map(() => '?').join(', ')})
       ON CONFLICT (id) DO UPDATE SET ${COLS.map(c => `${c} = excluded.${c}`).join(', ')}, updated_at = ${NOW}, removed_at = NULL`,
    ).bind(r.id, ...COLS.map(c => val(MACHINE[c](r.p)))));
    stmts.push(db.prepare(
      `INSERT INTO sources (key, photo_id, gallery, version, hash, facts) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (key) DO UPDATE SET photo_id = excluded.photo_id, gallery = excluded.gallery, version = excluded.version,
         hash = excluded.hash, facts = excluded.facts, seen_at = ${NOW}, removed_at = NULL`,
    ).bind(r.p.key, r.id, gallery, val(r.p.version), val(r.p.hash), r.facts));
    stmts.push(membership);
    // GPS at full precision and the whole camera record: private, never served.
    stmts.push(db.prepare(
      `INSERT INTO photo_private (photo_id, lat, lng, altitude, exif) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (photo_id) DO UPDATE SET lat = excluded.lat, lng = excluded.lng, altitude = excluded.altitude,
         exif = excluded.exif, updated_at = ${NOW}`,
    ).bind(r.id, val(r.pr.gps?.lat), val(r.pr.gps?.lng), val(r.pr.gps?.alt), r.pr.exif ? JSON.stringify(r.pr.exif) : null));
  }
  // Sources this gallery no longer lists: removed, with their membership; the photo once nothing holds it.
  const live = new Set(entries.map(p => p.key));
  const gone = [...sources.values()].filter(s => s.removed_at == null && !live.has(s.key) && s.key.startsWith(`${gallery}/`) && !s.key.slice(gallery.length + 1).includes('/'));
  for (const s of gone) {
    counts.removed++;
    stmts.push(db.prepare(`UPDATE sources SET removed_at = ${NOW} WHERE key = ?`).bind(s.key));
    stmts.push(db.prepare(`UPDATE memberships SET removed_at = ${NOW} WHERE gallery = ? AND photo_id = ?`).bind(gallery, s.photo_id));
    stmts.push(db.prepare(`UPDATE photos SET removed_at = ${NOW}, updated_at = ${NOW} WHERE id = ? AND NOT EXISTS (SELECT 1 FROM sources WHERE photo_id = ? AND removed_at IS NULL AND key != ?)`).bind(s.photo_id, s.photo_id, s.key));
  }
  stmts.push(db.prepare(`INSERT INTO galleries (gallery, generated_at) VALUES (?, ?) ON CONFLICT (gallery) DO UPDATE SET generated_at = excluded.generated_at, updated_at = ${NOW}`)
    .bind(gallery, val(manifest?.generated)));
  for (const c of chunks(stmts, 50)) await db.batch(c);
  return counts;
}

/** Galleries touched by a batch of R2 event messages. */
export function touched(messages) {
  const out = new Set();
  for (const m of messages) {
    const key = m.body?.object?.key || '';
    if (key.startsWith('trash/')) continue;
    const m1 = key.match(/^(.+)\/(manifest\.json|\.private\.json)$/);
    if (m1) out.add(m1[1]);
  }
  return [...out];
}

const CORS = ['https://qsdqsb.com', 'http://localhost:4000'];
function json(body, req, status = 200) {
  const origin = req.headers.get('Origin');
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=60',
      ...(CORS.includes(origin) ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}),
    },
  });
}
const decode = (x) => ({ ...x, sizes: x.sizes ? JSON.parse(x.sizes) : null, formats: x.formats ? JSON.parse(x.formats) : null });

export default {
  async queue(batch, env) {
    for (const g of touched(batch.messages)) {
      // The manifest lives beside the originals, in the locked bucket.
      const [m, p] = await Promise.all([env.ORIGINALS.get(`${g}/manifest.json`), env.ORIGINALS.get(`${g}/.private.json`)]);
      if (!m) continue;
      console.log(g, JSON.stringify(await syncGallery(env.DB, g, await m.json(), p ? await p.json() : null)));
    }
    batch.ackAll();
  },

  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method !== 'GET') return json({ error: 'read-only' }, req, 405);
    const cols = PUBLIC.map(c => `p.${c}`).join(', ');
    if (url.pathname === '/v1/galleries') {
      const r = await env.DB.prepare(
        `SELECT g.gallery, g.title, g.generated_at, g.updated_at,
                (SELECT COUNT(*) FROM memberships m WHERE m.gallery = g.gallery AND m.removed_at IS NULL) AS count
         FROM galleries g ORDER BY g.gallery`).all();
      return json({ galleries: r.results }, req);
    }
    const one = url.pathname.match(/^\/v1\/photos\/(p_[0-9A-Z]{26})$/);
    if (one) {
      const p = await env.DB.prepare(`SELECT ${cols} FROM photos p WHERE p.id = ?`).bind(one[1]).first();
      if (!p) return json({ error: 'no such photo' }, req, 404);
      const g = await env.DB.prepare('SELECT gallery, pin FROM memberships WHERE photo_id = ? AND removed_at IS NULL').bind(one[1]).all();
      return json({ ...decode(p), galleries: g.results }, req);
    }
    if (url.pathname === '/v1/photos') {
      const gallery = url.searchParams.get('gallery'), since = url.searchParams.get('since');
      let r;
      if (gallery) {
        r = await env.DB.prepare(`SELECT ${cols}, m.pin FROM memberships m JOIN photos p ON p.id = m.photo_id
          WHERE m.gallery = ? AND m.removed_at IS NULL AND p.removed_at IS NULL
          ORDER BY m.pin IS NULL, m.pin, p.taken IS NULL, p.taken, p.frame`).bind(gallery).all();
      } else if (since) {
        r = await env.DB.prepare(`SELECT ${cols}, (SELECT json_group_array(gallery) FROM memberships m WHERE m.photo_id = p.id AND m.removed_at IS NULL) AS galleries
          FROM photos p WHERE p.updated_at > ? ORDER BY p.updated_at`).bind(since).all();
      } else return json({ error: 'give ?gallery= or ?since=' }, req, 400);
      const rows = r.results.map(x => ({ ...decode(x), ...(x.galleries ? { galleries: JSON.parse(x.galleries) } : {}) }));
      return json({ now: new Date().toISOString(), count: rows.length, photos: rows }, req);
    }
    if (url.pathname === '/v1/health') return json({ ok: true }, req);
    return json({ error: 'not found', routes: ['/v1/galleries', '/v1/photos?gallery=', '/v1/photos?since=', '/v1/photos/<id>'] }, req, 404);
  },
};
