-- Migration 008: Add created_by to stop_activities for collaborative visibility
-- Adds created_by referencing users; backfills existing rows with owning trip's user_id.
ALTER TABLE stop_activities ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);

-- Backfill existing rows (only where NULL) using trip owner.
UPDATE stop_activities sa
SET created_by = t.user_id
FROM trip_stops s
JOIN trips t ON s.trip_id = t.id
WHERE sa.trip_stop_id = s.id AND sa.created_by IS NULL;

CREATE INDEX IF NOT EXISTS idx_stop_activities_created_by ON stop_activities(created_by);

-- Note: We intentionally do not make created_by NOT NULL yet to allow safe forward deployment.
-- A later migration can enforce NOT NULL after confirming all rows populated:
-- ALTER TABLE stop_activities ALTER COLUMN created_by SET NOT NULL;