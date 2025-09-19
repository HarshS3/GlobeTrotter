-- Migration: Simplify activity model to per-stop activities only
-- 1. Create new stop_activities table
CREATE TABLE IF NOT EXISTS stop_activities (
  id SERIAL PRIMARY KEY,
  trip_stop_id INTEGER NOT NULL REFERENCES trip_stops(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT,
  cost NUMERIC(12,2) NOT NULL,
  duration_minutes INTEGER,
  day_offset INTEGER NOT NULL DEFAULT 0,
  start_time TIME,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stop_activities_stop ON stop_activities(trip_stop_id);

-- 2. Backfill existing data if legacy tables exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='trip_stop_activities')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='activities') THEN
    INSERT INTO stop_activities (trip_stop_id, title, category, cost, duration_minutes, day_offset, start_time, notes, metadata, created_at)
    SELECT tsa.trip_stop_id,
           a.title,
           a.category,
           COALESCE(tsa.cost_override, a.base_cost, 0) AS cost,
           a.duration_minutes,
           tsa.day_offset,
           tsa.start_time,
           tsa.notes,
           a.metadata,
           tsa.created_at
    FROM trip_stop_activities tsa
    JOIN activities a ON a.id = tsa.activity_id;
  END IF;
END$$;

-- 3. (Optional) Drop old tables after verifying backfill (commented out for safety)
-- DROP TABLE IF EXISTS trip_stop_activities;
-- DROP TABLE IF EXISTS activities;

-- Reversible strategy: to rollback, drop stop_activities and restore prior tables from backups.