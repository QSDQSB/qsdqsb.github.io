-- Stable photo identity. 0001 keyed photos by (gallery, frame number), which
-- breaks when a frame number repeats (every ~10,000 shots), when a file is
-- renamed, when a photo moves to another voyage, or sits in two. From here:
--
--   photos.id          opaque and permanent: 'p_' + ULID, assigned at first sight
--   camera key         body serial + shutter count (photo_private): one exposure,
--                      for ever; matches a re-export or re-collection to its id
--   photos.hash        the current original's content hash; tiers live at
--                      t/<hash>/<size>.<fmt>, so a new original is a new URL
--   memberships        galleries are collections of photos, in their own order
--   sources            bucket keys (london/DSCF1797.jpg) → photo id
--
-- 0001's rows were a test sync, rebuilt from R2 by the Worker.

DROP TRIGGER IF EXISTS photos_audit;
DROP TABLE IF EXISTS audit;
DROP TABLE IF EXISTS photo_private;
DROP TABLE IF EXISTS photos;
DROP TABLE IF EXISTS galleries;

CREATE TABLE photos (
  id             TEXT PRIMARY KEY,          -- p_01J8…
  frame          TEXT,                      -- DSCF1797, as the camera named it
  hash           TEXT,                      -- sha256 of the current original, 16 hex
  version        TEXT,                      -- etag:size of that original in the bucket

  w INTEGER, h INTEGER, ratio REAL, thumbhash TEXT, tint TEXT,
  sizes TEXT, formats TEXT,                 -- JSON
  compressed INTEGER NOT NULL DEFAULT 0,    -- still the bootstrap's copy (transitional)
  processed_at TEXT,

  taken TEXT, camera TEXT, lens TEXT,
  focal REAL, focal35 REAL, aperture REAL, shutter TEXT, iso INTEGER, exposure_bias REAL,
  exposure_program TEXT, metering_mode TEXT, white_balance TEXT, flash TEXT,
  film_simulation TEXT, dynamic_range TEXT, dynamic_range_setting TEXT,
  grain_roughness TEXT, grain_size TEXT, color_chrome TEXT, color_chrome_blue TEXT,
  highlight_tone TEXT, shadow_tone TEXT, color TEXT, sharpness TEXT, noise_reduction TEXT, clarity TEXT,
  white_balance_fine_tune TEXT, focus_mode TEXT, af_mode TEXT, shutter_type TEXT, drive_mode TEXT, stabilization TEXT,
  shutter_count INTEGER,

  place TEXT, place_source TEXT, place_landmark TEXT, place_street TEXT, place_city TEXT, place_country TEXT,
  caption TEXT, caption_zh TEXT, alt TEXT, story TEXT, story_zh TEXT,
  featured INTEGER NOT NULL DEFAULT 0, hidden INTEGER NOT NULL DEFAULT 0,

  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  removed_at TEXT                           -- no source left; kept, never deleted
);
CREATE INDEX photos_updated ON photos(updated_at);
CREATE INDEX photos_taken ON photos(taken);
CREATE INDEX photos_frame ON photos(frame);
CREATE INDEX photos_hash ON photos(hash);
CREATE INDEX photos_film ON photos(film_simulation);
CREATE INDEX photos_lens ON photos(lens);

CREATE TABLE galleries (
  gallery TEXT PRIMARY KEY, title TEXT, generated_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE memberships (
  gallery  TEXT NOT NULL,
  photo_id TEXT NOT NULL REFERENCES photos(id),
  pin      INTEGER,                         -- position in this gallery's pinned order; NULL = by capture time
  added_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  removed_at TEXT,
  PRIMARY KEY (gallery, photo_id)
);
CREATE INDEX memberships_photo ON memberships(photo_id);

CREATE TABLE sources (
  key      TEXT PRIMARY KEY,                -- originals bucket key: london/DSCF1797.jpg
  photo_id TEXT NOT NULL REFERENCES photos(id),
  gallery  TEXT NOT NULL,
  version  TEXT, hash TEXT,
  seen_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  removed_at TEXT
);
CREATE INDEX sources_photo ON sources(photo_id);
CREATE INDEX sources_hash ON sources(hash);

-- Never served: the read API selects from photos and memberships only.
CREATE TABLE photo_private (
  photo_id TEXT PRIMARY KEY REFERENCES photos(id),
  camera_serial TEXT, lens_serial TEXT, shutter_count INTEGER,
  lat REAL, lng REAL, altitude REAL,
  exif TEXT,                                -- JSON, the whole camera record
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
-- One exposure, one photo: the key that makes identity survive re-exports.
CREATE UNIQUE INDEX photo_private_exposure ON photo_private(camera_serial, shutter_count)
  WHERE camera_serial IS NOT NULL AND shutter_count IS NOT NULL;

CREATE TABLE audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  photo_id TEXT NOT NULL,
  before TEXT, after TEXT,
  at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX audit_photo ON audit(photo_id, at);

CREATE TRIGGER photos_audit AFTER UPDATE ON photos
WHEN old.caption IS NOT new.caption OR old.caption_zh IS NOT new.caption_zh OR old.alt IS NOT new.alt
  OR old.story IS NOT new.story OR old.story_zh IS NOT new.story_zh OR old.featured IS NOT new.featured
  OR old.hidden IS NOT new.hidden OR old.place IS NOT new.place
BEGIN
  INSERT INTO audit (photo_id, before, after) VALUES (new.id,
    json_object('caption', old.caption, 'caption_zh', old.caption_zh, 'alt', old.alt, 'story', old.story, 'story_zh', old.story_zh,
                'featured', old.featured, 'hidden', old.hidden, 'place', old.place),
    json_object('caption', new.caption, 'caption_zh', new.caption_zh, 'alt', new.alt, 'story', new.story, 'story_zh', new.story_zh,
                'featured', new.featured, 'hidden', new.hidden, 'place', new.place));
END;

CREATE TRIGGER memberships_audit AFTER UPDATE OF pin ON memberships WHEN old.pin IS NOT new.pin
BEGIN
  INSERT INTO audit (photo_id, before, after) VALUES (new.photo_id,
    json_object('gallery', old.gallery, 'pin', old.pin), json_object('gallery', new.gallery, 'pin', new.pin));
END;
