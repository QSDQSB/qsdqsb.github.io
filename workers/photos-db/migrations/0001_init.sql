-- The photo database: one row per photograph, one source of truth for
-- everything the site and its future UI know about a picture.
--
-- Who writes what:
--   the photos-db Worker    machine fields, from each gallery's manifest.json
--                           and .private.json as the processor writes them
--                           (R2 event → queue → upsert of changed rows only)
--   photos:locate           place_* fields
--   photos:meta             caption, story, alt, featured, hidden, pin
-- The audit trigger records every change to the authored and place fields.

CREATE TABLE galleries (
  gallery       TEXT PRIMARY KEY,          -- 'london', 'prague/twilight'
  title         TEXT,                      -- display override
  generated_at  TEXT,                      -- manifest.json's generated
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE photos (
  gallery        TEXT NOT NULL,
  slug           TEXT NOT NULL,             -- camera frame number, lowercased: dscf1797
  file           TEXT,                      -- original's name in the bucket
  version        TEXT,                      -- etag:size of that original; a new one means re-processed

  -- picture
  w INTEGER, h INTEGER, ratio REAL,
  thumbhash TEXT, tint TEXT,
  sizes TEXT,                               -- JSON {webp:[480,…], jpg:[…], avif:[…]}
  formats TEXT,                             -- JSON ["webp","jpg","avif"]
  compressed INTEGER NOT NULL DEFAULT 0,    -- still the bootstrap's compressed copy (transitional)
  processed_at TEXT,

  -- capture
  taken TEXT,                               -- camera wall-clock with offset: 2024-07-14T20:44:12+01:00
  camera TEXT, lens TEXT,
  focal REAL, focal35 REAL, aperture REAL, shutter TEXT, iso INTEGER, exposure_bias REAL,
  exposure_program TEXT, metering_mode TEXT, white_balance TEXT, flash TEXT,

  -- the camera's own rendering, from the Fujifilm maker notes
  film_simulation TEXT,                     -- Classic Negative, Acros, Classic Chrome…
  dynamic_range TEXT, dynamic_range_setting TEXT,
  grain_roughness TEXT, grain_size TEXT,
  color_chrome TEXT, color_chrome_blue TEXT,
  highlight_tone TEXT, shadow_tone TEXT,
  color TEXT, sharpness TEXT, noise_reduction TEXT, clarity TEXT,
  white_balance_fine_tune TEXT,
  focus_mode TEXT, af_mode TEXT, shutter_type TEXT, drive_mode TEXT, stabilization TEXT,
  shutter_count INTEGER,                    -- per body; with the serial (private) a unique identity

  -- where (photos:locate), names only; coordinates live in photo_private
  place TEXT,                               -- 'Tower of London, London'
  place_source TEXT,                        -- 'gps' | 'visual guess' | 'legacy'
  place_landmark TEXT, place_street TEXT, place_city TEXT, place_country TEXT,

  -- authored
  caption TEXT, caption_zh TEXT, alt TEXT, story TEXT, story_zh TEXT,
  featured INTEGER NOT NULL DEFAULT 0,
  hidden INTEGER NOT NULL DEFAULT 0,
  pin INTEGER,                              -- position in the pinned order; NULL = by capture time

  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  removed_at TEXT,                          -- the original left the bucket; kept, never deleted
  PRIMARY KEY (gallery, slug)
);
CREATE INDEX photos_updated ON photos(updated_at);
CREATE INDEX photos_taken ON photos(taken);
CREATE INDEX photos_film ON photos(film_simulation);
CREATE INDEX photos_lens ON photos(lens);

-- Never served: the read API selects from `photos` only.
CREATE TABLE photo_private (
  gallery TEXT NOT NULL, slug TEXT NOT NULL,
  lat REAL, lng REAL, altitude REAL,
  camera_serial TEXT, lens_serial TEXT,
  exif TEXT,                                -- JSON, everything the original carries
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (gallery, slug)
);

CREATE TABLE audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gallery TEXT NOT NULL, slug TEXT NOT NULL,
  before TEXT, after TEXT,                  -- JSON of the authored and place fields
  at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX audit_photo ON audit(gallery, slug, at);

CREATE TRIGGER photos_audit AFTER UPDATE ON photos
WHEN old.caption IS NOT new.caption OR old.caption_zh IS NOT new.caption_zh OR old.alt IS NOT new.alt
  OR old.story IS NOT new.story OR old.story_zh IS NOT new.story_zh OR old.featured IS NOT new.featured
  OR old.hidden IS NOT new.hidden OR old.pin IS NOT new.pin OR old.place IS NOT new.place
BEGIN
  INSERT INTO audit (gallery, slug, before, after) VALUES (
    new.gallery, new.slug,
    json_object('caption', old.caption, 'caption_zh', old.caption_zh, 'alt', old.alt, 'story', old.story, 'story_zh', old.story_zh,
                'featured', old.featured, 'hidden', old.hidden, 'pin', old.pin, 'place', old.place),
    json_object('caption', new.caption, 'caption_zh', new.caption_zh, 'alt', new.alt, 'story', new.story, 'story_zh', new.story_zh,
                'featured', new.featured, 'hidden', new.hidden, 'pin', new.pin, 'place', new.place));
END;
