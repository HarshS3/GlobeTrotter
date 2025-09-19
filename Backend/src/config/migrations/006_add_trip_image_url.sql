-- Add image_url column to trips for custom cover/hero images distinct from cover_photo_url (which may be uploaded)
ALTER TABLE trips ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE stop_activities ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Optional index if you'll query by image presence (not needed now)
-- CREATE INDEX IF NOT EXISTS idx_trips_image_url_not_null ON trips((image_url IS NOT NULL)) WHERE image_url IS NOT NULL;