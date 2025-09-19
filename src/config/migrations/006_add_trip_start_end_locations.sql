-- Migration: Add start and end location columns to trips
-- Adds textual location fields independent of stops list.
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS start_location TEXT,
  ADD COLUMN IF NOT EXISTS end_location TEXT;

-- Optional: backfill strategy could set start_location = first stop city, end_location = last stop city later if desired.
-- No NOT NULL constraint yet to avoid failures for existing rows; application-level validation will enforce on new creations.