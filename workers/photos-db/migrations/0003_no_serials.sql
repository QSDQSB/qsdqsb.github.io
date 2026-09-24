-- No serial number is kept: body and lens serials leave photo_private, and
-- one exposure is named by camera model + shutter count instead, both
-- already public columns of photos. GPS stays private, at full precision.

DROP INDEX IF EXISTS photo_private_exposure;
ALTER TABLE photo_private DROP COLUMN camera_serial;
ALTER TABLE photo_private DROP COLUMN lens_serial;
ALTER TABLE photo_private DROP COLUMN shutter_count;

CREATE UNIQUE INDEX photos_exposure ON photos(camera, shutter_count)
  WHERE camera IS NOT NULL AND shutter_count IS NOT NULL;
