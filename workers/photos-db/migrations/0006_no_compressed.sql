-- The bootstrap's compressed copies are gone: every photograph is a camera original, and the
-- column that marked a copy (always 0 since 2026-09-25) goes with the scaffolding that set it.

ALTER TABLE photos DROP COLUMN compressed;
