-- The sun at the moment of each frame, worked out once by process.mjs at
-- city precision: its height and bearing in degrees, whether it was rising,
-- and signed whole minutes to the nearest sunrise, sunset and solar noon
-- (negative: already past). The site words it; nothing here is phrased.

ALTER TABLE photos ADD COLUMN sun_alt REAL;
ALTER TABLE photos ADD COLUMN sun_az INTEGER;
ALTER TABLE photos ADD COLUMN sun_rising INTEGER;
ALTER TABLE photos ADD COLUMN to_sunrise INTEGER;
ALTER TABLE photos ADD COLUMN to_sunset INTEGER;
ALTER TABLE photos ADD COLUMN to_noon INTEGER;

-- A digest of everything derived for a photo, so a fact added later still
-- reaches rows whose original never changed (see factsDigest).
ALTER TABLE sources ADD COLUMN facts TEXT;
