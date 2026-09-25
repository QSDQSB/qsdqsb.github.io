-- The weather at the moment of each frame, asked once by process.mjs of Open-Meteo's historical
-- archive: the air temperature in whole degrees Celsius and the WMO weather code of the hour
-- nearest the frame. The site words and draws it; nothing here is phrased.

ALTER TABLE photos ADD COLUMN temp_c INTEGER;
ALTER TABLE photos ADD COLUMN weather_code INTEGER;
